import { describe, expect, it, vi, afterEach } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves successfully if promise finishes before timeout", async () => {
    vi.useFakeTimers();
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve("success"), 50));

    const resultPromise = withTimeout(promise, 100);
    vi.advanceTimersByTime(50);

    await expect(resultPromise).resolves.toBe("success");
  });

  it("rejects with timeout error if promise takes too long", async () => {
    vi.useFakeTimers();
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve("success"), 150));

    const resultPromise = withTimeout(promise, 100);
    // Explicitly catch the rejection to prevent Unhandled Rejection warnings
    resultPromise.catch(() => {});

    vi.advanceTimersByTime(100);

    await expect(resultPromise).rejects.toThrow("timeout");
  });

  it("returns original promise if timeoutMs is 0 or less", async () => {
    const promise = Promise.resolve("success");
    const result = await withTimeout(promise, 0);
    expect(result).toBe("success");

    const result2 = await withTimeout(promise, -100);
    expect(result2).toBe("success");
  });
});
