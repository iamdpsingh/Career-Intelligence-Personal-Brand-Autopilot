import { z } from "zod";
import { AIProvider } from "./provider";

/**
 * Implementation of AIProvider using NVIDIA NIM API.
 * This allows us to use open-source models like DeepSeek AI (deepseek-v4.1-flash)
 * for cost-effective and high-quality generation.
 */
export class NvidiaNimProvider implements AIProvider {
  name: string;
  private apiKey: string;
  private baseUrl = "https://integrate.api.nvidia.com/v1";

  constructor(modelName: string = "deepseek-ai/deepseek-v4.1-flash") {
    this.name = `NVIDIA NIM (${modelName})`;
    this.apiKey = process.env.NVIDIA_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("[NvidiaNimProvider] NVIDIA_API_KEY is missing. AI calls will fail.");
    }
  }

  async generateText(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        // Defaulting to deepseek-ai per user request for open source integration
        model: "deepseek-ai/deepseek-v4.1-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      throw new Error(`NVIDIA NIM API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateStructured<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    // In a production environment, we would use JSON mode or function calling
    // with the DeepSeek model if supported, or instruct the model to output strict JSON.
    const structuredPrompt = `${prompt}\n\nRespond ONLY with valid JSON matching this schema. Do not include markdown formatting.\n`;
    
    const textOutput = await this.generateText(structuredPrompt);
    
    try {
      const parsed = JSON.parse(textOutput);
      return schema.parse(parsed);
    } catch (error) {
      console.error("[NvidiaNimProvider] Failed to parse structured output:", textOutput);
      throw new Error("AI output did not match required JSON schema.");
    }
  }
}
