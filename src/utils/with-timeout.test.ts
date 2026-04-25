import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves the original promise if it completes before the timeout", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("success"), 500);
    });

    const timeoutPromise = withTimeout(promise, 1000);

    // Fast-forward time to trigger the promise's internal timeout
    vi.advanceTimersByTime(500);

    const result = await timeoutPromise;
    expect(result).toBe("success");
  });

  it("rejects with a timeout error if the promise takes longer than the timeout", async () => {
    const promise = new Promise<string>((resolve) => {
      // Intentionally slow
      setTimeout(() => resolve("too slow"), 2000);
    });

    const timeoutPromise = withTimeout(promise, 1000);

    // Fast-forward past the timeout
    vi.advanceTimersByTime(1001);

    await expect(timeoutPromise).rejects.toThrowError("timeout");
  });

  it("bypasses the timeout if timeoutMs is 0", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("done"), 500);
    });

    const timeoutPromise = withTimeout(promise, 0);

    vi.advanceTimersByTime(500);

    const result = await timeoutPromise;
    expect(result).toBe("done");
  });

  it("bypasses the timeout if timeoutMs is negative", async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("done"), 500);
    });

    const timeoutPromise = withTimeout(promise, -100);

    vi.advanceTimersByTime(500);

    const result = await timeoutPromise;
    expect(result).toBe("done");
  });

  it("bypasses the timeout if timeoutMs is falsy (undefined/null/NaN)", async () => {
    const promise = Promise.resolve("done");

    // We cast to any to test the falsy check logic
    const result1 = await withTimeout(promise, undefined as any);
    expect(result1).toBe("done");

    const result2 = await withTimeout(promise, null as any);
    expect(result2).toBe("done");

    const result3 = await withTimeout(promise, NaN);
    expect(result3).toBe("done");
  });
});
