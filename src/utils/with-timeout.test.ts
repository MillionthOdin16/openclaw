import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves properly if promise completes before timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 50));
    const result = withTimeout(promise, 100);

    vi.advanceTimersByTime(50);
    await expect(result).resolves.toBe("done");
  });

  it("rejects with an Error if timeout is reached", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 150));
    const result = withTimeout(promise, 100);

    vi.advanceTimersByTime(100);
    await expect(result).rejects.toThrow("timeout");
  });

  it("returns original promise if timeoutMs is 0", async () => {
    const promise = Promise.resolve("done");
    const result = withTimeout(promise, 0);

    await expect(result).resolves.toBe("done");
  });

  it("returns original promise if timeoutMs is negative", async () => {
    const promise = Promise.resolve("done");
    const result = withTimeout(promise, -5);

    await expect(result).resolves.toBe("done");
  });

  it("does not crash if timer is null in finally block", async () => {
    const promise = Promise.resolve("done");
    const result = withTimeout(promise, 100);
    vi.advanceTimersByTime(1);
    await expect(result).resolves.toBe("done");
  });
});
