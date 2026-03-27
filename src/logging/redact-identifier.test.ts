import { describe, expect, it } from "vitest";
import { redactIdentifier, sha256HexPrefix } from "./redact-identifier.js";

describe("redactIdentifier", () => {
  it("redacts an identifier correctly with default length", () => {
    const input = "test-identifier";
    const result = redactIdentifier(input);
    expect(result).toMatch(/^sha256:[a-f0-9]{12}$/);
    expect(result).toBe("sha256:115ae872eb1d");
  });

  it("redacts an identifier with custom length", () => {
    const input = "test-identifier";
    const result = redactIdentifier(input, { len: 8 });
    expect(result).toMatch(/^sha256:[a-f0-9]{8}$/);
    expect(result).toBe("sha256:115ae872");
  });

  it("handles undefined input", () => {
    const result = redactIdentifier(undefined);
    expect(result).toBe("-");
  });

  it("handles empty string input", () => {
    const result = redactIdentifier("");
    expect(result).toBe("-");
  });

  it("handles whitespace input", () => {
    const result = redactIdentifier("   ");
    expect(result).toBe("-");
  });

  it("trims input before hashing", () => {
    const result1 = redactIdentifier("test-identifier");
    const result2 = redactIdentifier("  test-identifier  ");
    expect(result1).toBe(result2);
  });
});

describe("sha256HexPrefix", () => {
  it("generates a hash prefix of default length", () => {
    const result = sha256HexPrefix("test");
    expect(result).toHaveLength(12);
    expect(result).toBe("9f86d081884c");
  });

  it("generates a hash prefix of custom length", () => {
    const result = sha256HexPrefix("test", 16);
    expect(result).toHaveLength(16);
    expect(result).toBe("9f86d081884c7d65");
  });

  it("handles Infinity length by defaulting to 12", () => {
    const result = sha256HexPrefix("test", Infinity);
    expect(result).toHaveLength(12);
  });

  it("handles NaN length by defaulting to 12", () => {
    const result = sha256HexPrefix("test", NaN);
    expect(result).toHaveLength(12);
  });

  it("handles zero or negative length by clamping to 1", () => {
    const resultZero = sha256HexPrefix("test", 0);
    expect(resultZero).toHaveLength(1);
    const resultNeg = sha256HexPrefix("test", -5);
    expect(resultNeg).toHaveLength(1);
  });

  it("handles float length by flooring", () => {
    const result = sha256HexPrefix("test", 5.9);
    expect(result).toHaveLength(5);
  });
});
