/**
 * Retry, timeout, and error classification for AI provider calls.
 * Phase 2.1 — shared by gemini.ts and groq.ts.
 */

export class AIError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "TIMEOUT"
      | "RATE_LIMITED"
      | "INVALID_RESPONSE"
      | "API_ERROR"
      | "AUTH_ERROR",
    public readonly retryable: boolean,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AIError";
  }
}

/**
 * Wrap a promise with a timeout.
 * Rejects with AIError("TIMEOUT") if the promise doesn't resolve in time.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new AIError(
          `طلب التحليل تجاوز المهلة (${timeoutMs / 1000} ثانية)`,
          "TIMEOUT",
          true
        )
      );
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Retry a function with exponential backoff.
 * Only retries on retryable errors.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const { maxRetries = 1, baseDelayMs = 2000 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (err instanceof AIError && !err.retryable) {
        throw err;
      }

      if (attempt >= maxRetries) {
        break;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

/**
 * Classify API errors into typed AIError with Arabic messages where appropriate.
 * Use in catch blocks of provider methods.
 */
export function classifyError(err: unknown): AIError {
  if (err instanceof AIError) return err;

  const message = err instanceof Error ? err.message : String(err);

  if (
    message.includes("429") ||
    message.includes("rate") ||
    message.includes("quota")
  ) {
    return new AIError(
      "تم تجاوز حد الاستخدام، حاول لاحقاً",
      "RATE_LIMITED",
      true,
      err
    );
  }

  if (
    message.includes("401") ||
    message.includes("403") ||
    message.includes("API key")
  ) {
    return new AIError("مفتاح API غير صالح", "AUTH_ERROR", false, err);
  }

  if (
    message.includes("JSON") ||
    message.includes("parse") ||
    message.includes("Zod")
  ) {
    return new AIError("فشل تحليل استجابة AI", "INVALID_RESPONSE", true, err);
  }

  return new AIError(
    "حدث خطأ أثناء تحليل AI: " + message,
    "API_ERROR",
    true,
    err
  );
}
