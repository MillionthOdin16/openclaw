import { describe, expect, it } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("resolves if promise resolves before timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 100));
    await expect(withTimeout(promise, 500)).resolves.toBe("success");
  });

  it("rejects if promise rejects before timeout", async () => {
    const promise = new Promise((_, reject) => setTimeout(() => reject(new Error("failed")), 100));
    await expect(withTimeout(promise, 500)).rejects.toThrow("failed");
  });

  it("rejects with timeout error if timeout occurs first", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 500));
    await expect(withTimeout(promise, 100)).rejects.toThrow("timeout");
  });

  it("does not timeout if timeoutMs is 0 or negative", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 100));
    await expect(withTimeout(promise, 0)).resolves.toBe("success");
    await expect(withTimeout(promise, -50)).resolves.toBe("success");
  });
});
