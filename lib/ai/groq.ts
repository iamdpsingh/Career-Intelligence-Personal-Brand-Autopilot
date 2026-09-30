import { z } from "zod";
import { AIProvider } from "./provider";

export class GroqProvider implements AIProvider {
  name = "groq";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "openai/gpt-oss-120b") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateText(prompt: string): Promise<string> {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API Error: ${err}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || "";
  }

  async generateStructured<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    const systemPrompt = `You are a helpful data extraction assistant. You MUST return ONLY valid JSON matching this structure or explanation. No markdown formatting outside the JSON.\n\nRequired schema logic:\n- Make sure to strictly output a JSON object.`;
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${prompt}\n\nPlease output the JSON response now.` }
        ],
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API Error: ${err}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return schema.parse(parsed) as T;
    } catch (e) {
      console.error("[Groq Provider] Failed to parse or validate JSON:", content);
      throw e;
    }
  }
}
