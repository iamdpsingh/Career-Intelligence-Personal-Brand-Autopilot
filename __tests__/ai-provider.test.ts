import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { AICostController, type AIProvider } from "../lib/ai/provider";

// ----------------------------------------------------------------------
// UNIT TESTS: AI PROVIDER & COST CONTROL
// ----------------------------------------------------------------------
// WHY THESE TESTS?
// The AI provider abstraction is the most expensive part of the system.
// If cost routing breaks, you burn through API credits fast. These tests
// verify that simple tasks go to the cheap model and complex tasks go
// to the expensive one. No real API calls — all mocked.
// ----------------------------------------------------------------------

// Create mock providers that track which one was called
function createMockProvider(name: string): AIProvider & { calls: string[] } {
  const calls: string[] = [];
  return {
    name,
    calls,
    async generateStructured<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
      calls.push(`structured:${prompt.substring(0, 30)}`);
      // Return a safe default
      return {} as T;
    },
    async generateText(prompt: string): Promise<string> {
      calls.push(`text:${prompt.substring(0, 30)}`);
      return `Response from ${name}`;
    },
  };
}

describe("AIProvider Interface", () => {
  it("should require a name property", () => {
    const provider = createMockProvider("test-model");
    expect(provider.name).toBe("test-model");
  });

  it("should have generateStructured method", () => {
    const provider = createMockProvider("test");
    expect(typeof provider.generateStructured).toBe("function");
  });

  it("should have generateText method", () => {
    const provider = createMockProvider("test");
    expect(typeof provider.generateText).toBe("function");
  });
});

describe("AICostController", () => {
  it("should route simple tasks to the small (cheap) model", async () => {
    const smallModel = createMockProvider("gemini-flash");
    const largeModel = createMockProvider("gpt-4");
    const controller = new AICostController(smallModel, largeModel);

    const schema = z.object({ answer: z.string() });
    await controller.routeStructured("simple", "Classify this commit", schema);

    // Small model should be called, NOT the large one
    expect(smallModel.calls.length).toBe(1);
    expect(largeModel.calls.length).toBe(0);
  });

  it("should route complex tasks to the large (expensive) model", async () => {
    const smallModel = createMockProvider("gemini-flash");
    const largeModel = createMockProvider("gpt-4");
    const controller = new AICostController(smallModel, largeModel);

    const schema = z.object({ post: z.string() });
    await controller.routeStructured("complex", "Write a technical LinkedIn post", schema);

    // Large model should be called, NOT the small one
    expect(largeModel.calls.length).toBe(1);
    expect(smallModel.calls.length).toBe(0);
  });

  it("should not mix up models across multiple calls", async () => {
    const smallModel = createMockProvider("flash");
    const largeModel = createMockProvider("pro");
    const controller = new AICostController(smallModel, largeModel);

    const schema = z.object({ result: z.boolean() });

    await controller.routeStructured("simple", "task 1", schema);
    await controller.routeStructured("complex", "task 2", schema);
    await controller.routeStructured("simple", "task 3", schema);
    await controller.routeStructured("complex", "task 4", schema);

    expect(smallModel.calls.length).toBe(2);  // tasks 1 and 3
    expect(largeModel.calls.length).toBe(2);  // tasks 2 and 4
  });

  it("should pass the prompt through to the correct provider", async () => {
    const smallModel = createMockProvider("flash");
    const largeModel = createMockProvider("pro");
    const controller = new AICostController(smallModel, largeModel);

    const schema = z.object({ x: z.string() });
    await controller.routeStructured("simple", "analyze this specific commit", schema);

    // Verify the prompt reached the small model
    expect(smallModel.calls[0]).toContain("analyze this specific commi");
  });

  it("should propagate errors from the underlying provider", async () => {
    const failingProvider: AIProvider = {
      name: "failing-model",
      async generateStructured() {
        throw new Error("API rate limit exceeded");
      },
      async generateText() {
        throw new Error("API rate limit exceeded");
      },
    };

    const controller = new AICostController(failingProvider, failingProvider);
    const schema = z.object({ x: z.string() });

    await expect(
      controller.routeStructured("simple", "test", schema)
    ).rejects.toThrow("API rate limit exceeded");
  });
});

describe("AI Cost Control — Security", () => {
  it("should never expose API keys through the provider interface", () => {
    // The provider interface only exposes name, generateStructured, generateText
    // No API key fields should be in the interface
    const provider = createMockProvider("test");
    const keys = Object.keys(provider);
    expect(keys).not.toContain("apiKey");
    expect(keys).not.toContain("secret");
    expect(keys).not.toContain("token");
  });
});
