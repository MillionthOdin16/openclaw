import { describe, expect, it, vi } from "vitest";
import { withTimeout } from "./with-timeout";

describe("withTimeout", () => {
  it("should resolve if the promise resolves before the timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 10));
    await expect(withTimeout(promise, 50)).resolves.toBe("success");
  });

  it("should reject if the promise takes longer than the timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 50));
    await expect(withTimeout(promise, 10)).rejects.toThrow("timeout");
  });

  it("should return the original promise if timeoutMs is 0 or less", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 10));
    await expect(withTimeout(promise, 0)).resolves.toBe("success");
    const promise2 = new Promise((resolve) => setTimeout(() => resolve("success"), 10));
    await expect(withTimeout(promise2, -1)).resolves.toBe("success");
  });

  it("should return the original promise if timeoutMs is undefined/falsy", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 10));
    await expect(withTimeout(promise, undefined as any)).resolves.toBe("success");
  });

  it("should clear the timeout if promise resolves first", async () => {
    vi.useFakeTimers();
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 10));
    const timeoutPromise = withTimeout(promise, 50);
    vi.runAllTimers();
    await expect(timeoutPromise).resolves.toBe("success");
    vi.useRealTimers();
  });
});
