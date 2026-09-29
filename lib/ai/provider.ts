import { z } from "zod";

/**
 * Base interface for all AI models (OpenAI, Gemini, Local, etc.)
 * Rule 46: We never hardcode one provider so we aren't locked into paid services.
 */
export interface AIProvider {
  name: string;
  
  /**
   * Generates text based on a prompt, forcing the output to match a specific shape.
   * Rule 47: We require a Zod schema so we always get structured JSON output
   * to prevent parsing errors and hallucinations.
   */
  generateStructured<T>(prompt: string, schema: z.ZodType<T>): Promise<T>;
  
  /**
   * Simple text generation for when we just need a string (e.g., drafting the post).
   */
  generateText(prompt: string): Promise<string>;
}

/**
 * The Decision Engine for choosing the right AI model.
 * Rule 47: AI Cost-Control Layer.
 * "Before calling an AI model: Can a smaller model solve it? YES -> Small model"
 */
export class AICostController {
  private smallModel: AIProvider;
  private largeModel: AIProvider;

  constructor(small: AIProvider, large: AIProvider) {
    this.smallModel = small;
    this.largeModel = large;
  }

  /**
   * Routes the prompt to the most cost-effective model capable of handling it.
   * @param taskComplexity 'simple' for classification/extraction, 'complex' for heavy reasoning/drafting
   */
  async routeStructured<T>(taskComplexity: 'simple' | 'complex', prompt: string, schema: z.ZodType<T>): Promise<T> {
    if (taskComplexity === 'simple') {
      // Use a fast, cheap model (e.g., Gemini Flash, GPT-4o-mini, Local Llama)
      console.log(`[AI Cost Control] Routing task to cheaper model: ${this.smallModel.name}`);
      return this.smallModel.generateStructured(prompt, schema);
    } else {
      // Use the heavyweight model (e.g., GPT-4, Claude 3.5 Sonnet) only when strictly needed.
      console.log(`[AI Cost Control] Routing complex task to advanced model: ${this.largeModel.name}`);
      return this.largeModel.generateStructured(prompt, schema);
    }
  }
}
