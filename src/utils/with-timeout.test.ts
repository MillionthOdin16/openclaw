import { describe, it, expect } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("should resolve if promise resolves before timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 10));
    const result = await withTimeout(promise, 50);
    expect(result).toBe("success");
  });

  it("should reject if promise takes longer than timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 50));
    await expect(withTimeout(promise, 10)).rejects.toThrow("timeout");
  });

  it("should return original promise if timeoutMs is 0 or negative", async () => {
    const promise = Promise.resolve("success");
    expect(await withTimeout(promise, 0)).toBe("success");
    expect(await withTimeout(promise, -1)).toBe("success");
  });

  it("should reject if original promise rejects", async () => {
    const promise = Promise.reject(new Error("custom error"));
    await expect(withTimeout(promise, 50)).rejects.toThrow("custom error");
  });
});
