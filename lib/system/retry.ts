// ----------------------------------------------------------------------
// RETRY & FAILURE HANDLING (V2)
// ----------------------------------------------------------------------
// A generic retry wrapper with exponential backoff for external APIs.
// ----------------------------------------------------------------------

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: unknown) {
      attempt++;
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[Retry] Attempt ${attempt} failed: ${msg}`);
      
      if (attempt >= maxRetries) {
        console.error(`[Retry] Max retries (${maxRetries}) reached. Failing operation.`);
        throw error;
      }
      
      // Exponential backoff
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`[Retry] Waiting ${delay}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("Unreachable");
}
