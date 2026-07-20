import { describe, expect, it } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("resolves if promise resolves before timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 10));
    await expect(withTimeout(promise, 50)).resolves.toBe("done");
  });

  it("rejects if promise takes longer than timeout", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 50));
    await expect(withTimeout(promise, 10)).rejects.toThrow("timeout");
  });

  it("returns original promise if timeout is 0 or negative", async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve("done"), 10));
    await expect(withTimeout(promise, 0)).resolves.toBe("done");

    const promise2 = new Promise((resolve) => setTimeout(() => resolve("done"), 10));
    await expect(withTimeout(promise2, -10)).resolves.toBe("done");
  });
});
