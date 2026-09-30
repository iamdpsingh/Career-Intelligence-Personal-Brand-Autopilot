import { describe, it, expect } from "vitest";
import { withRetry } from "../lib/system/retry";

// ----------------------------------------------------------------------
// UNIT TESTS: RETRY SYSTEM
// ----------------------------------------------------------------------
// WHY THESE TESTS?
// The retry system is critical infrastructure. If it's broken, every
// external API call (GitHub, LinkedIn, HackerNews) fails silently or
// retries forever. These tests verify the backoff behavior, max retries,
// and error passthrough.
// ----------------------------------------------------------------------

describe("Retry System (withRetry)", () => {
  it("should succeed on first try when operation works", async () => {
    let callCount = 0;
    const result = await withRetry(async () => {
      callCount++;
      return "success";
    });

    expect(result).toBe("success");
    expect(callCount).toBe(1);
  });

  it("should retry on failure and succeed on second attempt", async () => {
    let callCount = 0;
    const result = await withRetry(async () => {
      callCount++;
      if (callCount < 2) {
        throw new Error("Temporary failure");
      }
      return "recovered";
    }, 3, 10); // Short delay for fast tests

    expect(result).toBe("recovered");
    expect(callCount).toBe(2);
  });

  it("should throw after max retries are exhausted", async () => {
    let callCount = 0;

    await expect(
      withRetry(async () => {
        callCount++;
        throw new Error("Persistent failure");
      }, 3, 10)
    ).rejects.toThrow("Persistent failure");

    // Should have tried exactly 3 times
    expect(callCount).toBe(3);
  });

  it("should respect the maxRetries parameter", async () => {
    let callCount = 0;

    await expect(
      withRetry(async () => {
        callCount++;
        throw new Error("fail");
      }, 5, 10) // 5 retries
    ).rejects.toThrow("fail");

    expect(callCount).toBe(5);
  });

  it("should apply exponential backoff (timing test)", async () => {
    let callCount = 0;
    const startTime = Date.now();

    await expect(
      withRetry(async () => {
        callCount++;
        throw new Error("fail");
      }, 3, 50) // 50ms base delay
    ).rejects.toThrow("fail");

    const elapsed = Date.now() - startTime;
    // With base 50ms and 3 retries:
    // attempt 1 fails → wait 50ms
    // attempt 2 fails → wait 100ms
    // attempt 3 fails → throw
    // Total wait: ~150ms minimum
    expect(elapsed).toBeGreaterThanOrEqual(100); // Some tolerance for slow CI
    expect(callCount).toBe(3);
  });

  it("should propagate the original error type", async () => {
    class CustomError extends Error {
      code: string;
      constructor(msg: string, code: string) {
        super(msg);
        this.code = code;
      }
    }

    try {
      await withRetry(async () => {
        throw new CustomError("API limit", "RATE_LIMITED");
      }, 1, 10);
    } catch (error: any) {
      expect(error).toBeInstanceOf(CustomError);
      expect(error.code).toBe("RATE_LIMITED");
    }
  });

  it("should handle async operations that take time", async () => {
    let callCount = 0;

    const result = await withRetry(async () => {
      callCount++;
      // Simulate a slow API call
      await new Promise(resolve => setTimeout(resolve, 20));
      if (callCount < 2) throw new Error("timeout");
      return "finally worked";
    }, 3, 10);

    expect(result).toBe("finally worked");
    expect(callCount).toBe(2);
  });
});
