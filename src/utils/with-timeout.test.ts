import { describe, expect, it } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("resolves the promise if it completes before the timeout", async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve("done"), 10));
    const result = await withTimeout(promise, 50);
    expect(result).toBe("done");
  });

  it("rejects with an error if the timeout is reached", async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve("done"), 50));
    await expect(withTimeout(promise, 10)).rejects.toThrowError("timeout");
  });

  it("returns the original promise if timeoutMs is 0 or less", async () => {
    const promise = new Promise<string>((resolve) => setTimeout(() => resolve("done"), 10));
    const result = await withTimeout(promise, 0);
    expect(result).toBe("done");
  });
});
