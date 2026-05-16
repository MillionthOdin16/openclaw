import { describe, expect, it } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("resolves if promise completes before timeout", async () => {
    const promise = Promise.resolve("success");
    const result = await withTimeout(promise, 100);
    expect(result).toBe("success");
  });

  it("rejects if promise rejects before timeout", async () => {
    const promise = Promise.reject(new Error("failed"));
    await expect(withTimeout(promise, 100)).rejects.toThrow("failed");
  });

  it("rejects with timeout error if promise takes too long", async () => {
    const promise = new Promise((resolve) => setTimeout(resolve, 200));
    await expect(withTimeout(promise, 50)).rejects.toThrow("timeout");
  });

  it("bypasses timeout if timeoutMs is 0 or negative", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 50));
    const result = await withTimeout(promise, 0);
    expect(result).toBe("done");

    const promise2 = new Promise((resolve) => setTimeout(() => resolve("done2"), 50));
    const result2 = await withTimeout(promise2, -10);
    expect(result2).toBe("done2");
  });
});
