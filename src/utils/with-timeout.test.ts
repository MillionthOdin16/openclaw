import { describe, expect, it } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("should return the promise result if it resolves before timeout", async () => {
    const p = new Promise((resolve) => setTimeout(() => resolve("ok"), 10));
    await expect(withTimeout(p, 50)).resolves.toBe("ok");
  });

  it("should reject if the promise takes longer than timeout", async () => {
    const p = new Promise((resolve) => setTimeout(() => resolve("ok"), 50));
    await expect(withTimeout(p, 10)).rejects.toThrow("timeout");
  });

  it("should handle 0 timeout by not adding a timeout", async () => {
    const p = new Promise((resolve) => setTimeout(() => resolve("ok"), 10));
    await expect(withTimeout(p, 0)).resolves.toBe("ok");
  });

  it("should reject if the promise rejects before timeout", async () => {
    const p = new Promise((_, reject) => setTimeout(() => reject(new Error("fail")), 10));
    await expect(withTimeout(p, 50)).rejects.toThrow("fail");
  });
});
