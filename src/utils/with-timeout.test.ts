import { describe, expect, it } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("returns the original promise if it resolves before timeout", async () => {
    const p = Promise.resolve("success");
    await expect(withTimeout(p, 100)).resolves.toBe("success");
  });

  it("returns the original promise if it rejects before timeout", async () => {
    const p = Promise.reject(new Error("fail"));
    await expect(withTimeout(p, 100)).rejects.toThrow("fail");
  });

  it("rejects with timeout error if promise takes too long", async () => {
    const p = new Promise((resolve) => setTimeout(resolve, 200));
    await expect(withTimeout(p, 10)).rejects.toThrow("timeout");
  });

  it("returns original promise if timeoutMs is 0 or negative", async () => {
    const p = Promise.resolve("ok");
    await expect(withTimeout(p, 0)).resolves.toBe("ok");
    await expect(withTimeout(p, -10)).resolves.toBe("ok");
  });
});
