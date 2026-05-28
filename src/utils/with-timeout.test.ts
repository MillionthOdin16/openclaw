import { describe, expect, it } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("resolves if promise resolves before timeout", async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve("success"), 10));
    const result = await withTimeout(promise, 50);
    expect(result).toBe("success");
  });

  it("rejects if promise takes longer than timeout", async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve("success"), 50));
    await expect(withTimeout(promise, 10)).rejects.toThrow("timeout");
  });

  it("returns original promise if timeoutMs is 0 or negative", async () => {
    const promise = Promise.resolve("success");
    expect(await withTimeout(promise, 0)).toBe("success");
    expect(await withTimeout(promise, -1)).toBe("success");
  });

  it("rejects if the original promise rejects", async () => {
    const promise = Promise.reject(new Error("original error"));
    await expect(withTimeout(promise, 50)).rejects.toThrow("original error");
  });
});
