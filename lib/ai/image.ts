import { db } from "@/providers/db";
import { contentImages } from "@/providers/db/schema";

// ----------------------------------------------------------------------
// NVIDIA IMAGE GENERATOR (V2)
// ----------------------------------------------------------------------
// Connects to Nvidia's NIM / build.nvidia.com API to generate cover
// images for the LinkedIn posts.
// ----------------------------------------------------------------------

export class ImageGenerator {
  private apiKey: string;
  // Defaulting to FLUX.1-schnell via Nvidia API (Fast, high-quality generation)
  private model = "black-forest-labs/flux_1-schnell"; 

  constructor() {
    const key = process.env.NVIDIA_API_KEY;
    if (!key) {
      throw new Error("NVIDIA_API_KEY is required for ImageGenerator.");
    }
    this.apiKey = key;
  }

  /**
   * Generates a prompt based on the content draft, then generates the image.
   * In a real implementation, you'd use the AI provider to extract a prompt first.
   */
  async generateForDraft(draftId: string, postContent: string): Promise<string> {
    console.log(`[ImageGenerator] Creating image for draft ${draftId}...`);
    
    // 1. Generate a safe, aesthetic prompt based on the content.
    // For V2 MVP, we extract a simple prompt from the first 50 chars of the content
    // and append professional aesthetic modifiers.
    const baseSubject = postContent.slice(0, 50).replace(/[^a-zA-Z0-9 ]/g, "").trim();
    const aestheticPrompt = `A clean, minimalist, professional 3D illustration representing: ${baseSubject}. Corporate aesthetic, soft lighting, vibrant but professional colors, 8k resolution, highly detailed, no text.`;

    console.log(`[ImageGenerator] Prompt: "${aestheticPrompt}"`);

    // 2. Call Nvidia's Image Generation API
    // Using the OpenAI-compatible endpoint provided by Nvidia NIM
    const response = await fetch("https://integrate.api.nvidia.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        prompt: aestheticPrompt,
        response_format: "b64_json",
        size: "1024x1024",
        steps: 40,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[ImageGenerator] Nvidia API Error:`, err);
      throw new Error(`Failed to generate image: ${response.statusText}`);
    }

    const data = await response.json();
    const base64Image = data.data[0].b64_json;
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    // 3. Save to database
    // In production (V3), we would upload this base64 string to AWS S3 or Vercel Blob
    // and store the CDN URL here. For now, we store the data URL directly.
    await db.insert(contentImages).values({
      draftId,
      prompt: aestheticPrompt,
      provider: "nvidia",
      storageUrl: dataUrl,
      altText: `AI generated illustration for: ${baseSubject}`,
    });

    console.log(`[ImageGenerator] Image saved to database for draft ${draftId}`);
    return dataUrl;
  }
}
