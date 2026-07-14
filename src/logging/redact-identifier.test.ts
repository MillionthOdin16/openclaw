import { describe, expect, it } from "vitest";
import { sha256HexPrefix, redactIdentifier } from "./redact-identifier.js";

describe("redact-identifier", () => {
  describe("sha256HexPrefix", () => {
    it("returns a 12-character hex string by default", () => {
      const result = sha256HexPrefix("test");
      expect(result).toHaveLength(12);
      // 'test' sha256 is 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
      expect(result).toBe("9f86d081884c");
    });

    it("respects the len parameter", () => {
      const result = sha256HexPrefix("test", 6);
      expect(result).toHaveLength(6);
      expect(result).toBe("9f86d0");
    });

    it("handles invalid len parameters gracefully", () => {
      expect(sha256HexPrefix("test", 0)).toHaveLength(1); // Math.max(1, Math.floor(len))
      expect(sha256HexPrefix("test", -5)).toHaveLength(1);
      expect(sha256HexPrefix("test", 5.9)).toHaveLength(5);
      expect(sha256HexPrefix("test", Number.NaN)).toHaveLength(12); // Number.isFinite check
      expect(sha256HexPrefix("test", Number.POSITIVE_INFINITY)).toHaveLength(12);
    });
  });

  describe("redactIdentifier", () => {
    it("redacts an identifier with sha256 prefix", () => {
      expect(redactIdentifier("test")).toBe("sha256:9f86d081884c");
    });

    it("trims whitespace before hashing", () => {
      expect(redactIdentifier("  test  ")).toBe("sha256:9f86d081884c");
    });

    it("returns '-' for empty or undefined values", () => {
      expect(redactIdentifier(undefined)).toBe("-");
      expect(redactIdentifier("")).toBe("-");
      expect(redactIdentifier("   ")).toBe("-");
    });

    it("respects the len option", () => {
      expect(redactIdentifier("test", { len: 8 })).toBe("sha256:9f86d081");
    });
  });
});
