import { describe, it, expect, vi, afterEach } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves when the promise resolves before the timeout", async () => {
    vi.useFakeTimers();
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 100));
    const resultPromise = withTimeout(promise, 200);

    vi.advanceTimersByTime(100);
    const result = await resultPromise;
    expect(result).toBe("success");
  });

  it("rejects when the promise does not resolve before the timeout", async () => {
    vi.useFakeTimers();
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 200));
    const resultPromise = withTimeout(promise, 100);

    // We catch the rejection to prevent unhandled rejections
    resultPromise.catch(() => {});

    vi.advanceTimersByTime(100);
    await expect(resultPromise).rejects.toThrow("timeout");
  });

  it("returns the original promise when timeout is 0", async () => {
    vi.useFakeTimers();
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 200));
    const resultPromise = withTimeout(promise, 0);

    vi.advanceTimersByTime(200);
    const result = await resultPromise;
    expect(result).toBe("success");
  });

  it("returns the original promise when timeout is negative", async () => {
    vi.useFakeTimers();
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 200));
    const resultPromise = withTimeout(promise, -50);

    vi.advanceTimersByTime(200);
    const result = await resultPromise;
    expect(result).toBe("success");
  });
});
