import { describe, expect, it } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("should resolve if the promise resolves before the timeout", async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve("success"), 10));
    const result = await withTimeout(promise, 50);
    expect(result).toBe("success");
  });

  it("should reject with a timeout error if the promise takes longer than the timeout", async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve("success"), 50));
    await expect(withTimeout(promise, 10)).rejects.toThrow("timeout");
  });

  it("should pass through promise rejection", async () => {
    const promise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("fail")), 10),
    );
    await expect(withTimeout(promise, 50)).rejects.toThrow("fail");
  });

  it("should return the original promise if timeoutMs is 0", async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve("success"), 10));
    const result = await withTimeout(promise, 0);
    expect(result).toBe("success");
  });

  it("should return the original promise if timeoutMs is negative", async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve("success"), 10));
    const result = await withTimeout(promise, -1);
    expect(result).toBe("success");
  });
});
