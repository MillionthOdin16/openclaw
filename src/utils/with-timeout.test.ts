import { describe, expect, it, vi } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("resolves normally if promise resolves before timeout", async () => {
    const promise = Promise.resolve("success");
    await expect(withTimeout(promise, 100)).resolves.toBe("success");
  });

  it("returns original promise if timeout is 0 or negative", async () => {
    const promise = Promise.resolve("success");
    await expect(withTimeout(promise, 0)).resolves.toBe("success");
    await expect(withTimeout(promise, -1)).resolves.toBe("success");
  });

  it("rejects with timeout error if promise takes too long", async () => {
    vi.useFakeTimers();
    const slowPromise = new Promise((resolve) => setTimeout(() => resolve("done"), 200));
    const timeoutPromise = withTimeout(slowPromise, 100);

    vi.advanceTimersByTime(150);
    await expect(timeoutPromise).rejects.toThrow("timeout");

    vi.useRealTimers();
  });
});
