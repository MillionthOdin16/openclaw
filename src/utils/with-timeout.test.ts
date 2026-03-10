import { describe, it, expect, vi, afterEach } from "vitest";
import { withTimeout } from "./with-timeout";

describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should resolve with original promise value if it completes before timeout", async () => {
    const promise = Promise.resolve("success");
    const result = await withTimeout(promise, 1000);
    expect(result).toBe("success");
  });

  it("should return the original promise if timeoutMs is 0", async () => {
    const promise = Promise.resolve("success");
    const result = await withTimeout(promise, 0);
    expect(result).toBe("success");
  });

  it("should return the original promise if timeoutMs is negative", async () => {
    const promise = Promise.resolve("success");
    const result = await withTimeout(promise, -100);
    expect(result).toBe("success");
  });

  it("should reject with 'timeout' error if promise takes longer than timeoutMs", async () => {
    vi.useFakeTimers();

    const longPromise = new Promise((resolve) => {
      setTimeout(() => resolve("late"), 2000);
    });

    const promise = withTimeout(longPromise, 1000);

    vi.advanceTimersByTime(1001);

    await expect(promise).rejects.toThrow("timeout");

    // Fast forward enough for the promise to complete too if timeout doesn't happen
    vi.runAllTimers();
  });
});
