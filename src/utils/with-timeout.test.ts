import { describe, expect, it } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("resolves if promise completes before timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 10));
    await expect(withTimeout(promise, 50)).resolves.toBe("done");
  });

  it("rejects if promise does not complete before timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 50));
    await expect(withTimeout(promise, 10)).rejects.toThrow("timeout");
  });

  it("resolves if promise completes if timeoutMs is 0 or less", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 10));
    await expect(withTimeout(promise, 0)).resolves.toBe("done");

    const promise2 = new Promise((resolve) => setTimeout(() => resolve("done2"), 10));
    await expect(withTimeout(promise2, -1)).resolves.toBe("done2");
  });

  it("rejects if original promise rejects", async () => {
    const promise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("original error")), 10),
    );
    await expect(withTimeout(promise, 50)).rejects.toThrow("original error");
  });
});
