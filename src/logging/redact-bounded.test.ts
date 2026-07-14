import { describe, expect, it } from "vitest";
import { replacePatternBounded } from "./redact-bounded.js";

describe("redact-bounded", () => {
  describe("replacePatternBounded", () => {
    it("works like String.prototype.replace for short strings", () => {
      const text = "hello world";
      const pattern = /world/;
      const replacer = "vitest";
      expect(replacePatternBounded(text, pattern, replacer)).toBe("hello vitest");
    });

    it("chunks text that exceeds chunkThreshold", () => {
      // chunk threshold of 10, chunk size of 5
      const text = "123456789012345";
      const pattern = /3/g;
      const replacer = "X";
      const result = replacePatternBounded(text, pattern, replacer, {
        chunkThreshold: 10,
        chunkSize: 5,
      });
      // "12345" (index 0) -> "12X45"
      // "67890" (index 5) -> "67890"
      // "12345" (index 10) -> "12X45"
      expect(result).toBe("12X456789012X45");
    });

    it("falls back to standard replace if chunkThreshold <= 0", () => {
      const text = "hello world";
      const result = replacePatternBounded(text, /o/g, "X", {
        chunkThreshold: 0,
      });
      expect(result).toBe("hellX wXrld");
    });

    it("falls back to standard replace if chunkSize <= 0", () => {
      const text = "hello world";
      const result = replacePatternBounded(text, /o/g, "X", {
        chunkSize: 0,
        chunkThreshold: 5,
      });
      expect(result).toBe("hellX wXrld");
    });

    it("replaces correctly across multiple boundaries", () => {
      const text = "hello hello hello";
      const result = replacePatternBounded(text, /hello/g, "hi", {
        chunkSize: 6,
        chunkThreshold: 10,
      });
      // "hello " -> "hi "
      // "hello " -> "hi "
      // "hello" -> "hi"
      expect(result).toBe("hi hi hi");
    });
  });
});
