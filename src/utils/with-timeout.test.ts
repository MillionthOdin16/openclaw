import { describe, expect, it } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("resolves if promise completes before timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 100));
    await expect(withTimeout(promise, 500)).resolves.toBe("done");
  });

  it("rejects if promise takes longer than timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 500));
    await expect(withTimeout(promise, 100)).rejects.toThrow("timeout");
  });

  it("rejects with original error if promise fails before timeout", async () => {
    const promise = new Promise((_, reject) => setTimeout(() => reject(new Error("original fail")), 100));
    await expect(withTimeout(promise, 500)).rejects.toThrow("original fail");
  });

  it("returns original promise if timeout is 0 or negative", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 100));
    await expect(withTimeout(promise, 0)).resolves.toBe("done");

    const promise2 = new Promise((resolve) => setTimeout(() => resolve("done2"), 100));
    await expect(withTimeout(promise2, -1)).resolves.toBe("done2");
  });
});
