import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves with the promise value if it resolves before the timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 50));

    const resultPromise = withTimeout(promise, 100);
    vi.advanceTimersByTime(50);

    await expect(resultPromise).resolves.toBe("success");
  });

  it("rejects with a timeout error if the promise takes longer than the timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 150));

    const resultPromise = withTimeout(promise, 100);
    vi.advanceTimersByTime(100);

    await expect(resultPromise).rejects.toThrow("timeout");
  });

  it("rejects with the promise error if the promise rejects before the timeout", async () => {
    const promise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("original error")), 50),
    );

    const resultPromise = withTimeout(promise, 100);
    vi.advanceTimersByTime(50);

    await expect(resultPromise).rejects.toThrow("original error");
  });

  it("returns the original promise if timeoutMs is 0 or negative or not provided", async () => {
    const promise = Promise.resolve("success");
    expect(withTimeout(promise, 0)).toBe(promise);
    expect(withTimeout(promise, -10)).toBe(promise);
    expect(withTimeout(promise, undefined as unknown as number)).toBe(promise);
  });
});
