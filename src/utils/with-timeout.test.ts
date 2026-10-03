import { describe, it, expect } from "vitest";
import { withTimeout } from "./with-timeout.ts";

describe("withTimeout", () => {
  it("should return the promise value if it resolves before timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("ok"), 10));
    await expect(withTimeout(promise, 100)).resolves.toBe("ok");
  });

  it("should reject with timeout error if promise takes too long", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("ok"), 100));
    await expect(withTimeout(promise, 10)).rejects.toThrow("timeout");
  });

  it("should not timeout if timeoutMs is 0 or less", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("ok"), 20));
    await expect(withTimeout(promise, 0)).resolves.toBe("ok");
    await expect(withTimeout(promise, -1)).resolves.toBe("ok");
  });

  it("should propagate promise rejection", async () => {
    const promise = Promise.reject(new Error("fail"));
    await expect(withTimeout(promise, 100)).rejects.toThrow("fail");
  });
});
