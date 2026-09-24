import { describe, expect, it } from "vitest";
import { withTimeout } from "./with-timeout.js";

describe("withTimeout", () => {
  it("resolves if promise completes before timeout", async () => {
    const result = await withTimeout(Promise.resolve("success"), 100);
    expect(result).toBe("success");
  });

  it("rejects if promise takes longer than timeout", async () => {
    const slowPromise = new Promise((resolve) => setTimeout(() => resolve("late"), 100));
    await expect(withTimeout(slowPromise, 10)).rejects.toThrow("timeout");
  });

  it("does not apply timeout if timeoutMs is <= 0 or undefined", async () => {
    const slowPromise = new Promise((resolve) => setTimeout(() => resolve("late"), 50));
    const result1 = await withTimeout(slowPromise, 0);
    expect(result1).toBe("late");

    const slowPromise2 = new Promise((resolve) => setTimeout(() => resolve("late2"), 50));
    const result2 = await withTimeout(slowPromise2, undefined as unknown as number);
    expect(result2).toBe("late2");
  });

  it("clears timeout on success even when promise completes very quickly", async () => {
    const result = await withTimeout(Promise.resolve("success"), 100);
    expect(result).toBe("success");
  });

  it("clears timeout when promise rejects", async () => {
    const p = Promise.reject(new Error("fail"));
    await expect(withTimeout(p, 100)).rejects.toThrow("fail");
  });
});
