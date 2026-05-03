import { describe, expect, it } from "vitest";
import { normalizeSecretInput, normalizeOptionalSecretInput } from "./normalize-secret-input.js";

describe("normalizeSecretInput", () => {
  it("should remove newlines and return trimmed strings", () => {
    expect(normalizeSecretInput("  abc \n def\r\n ghi  ")).toBe("abc  def ghi");
  });

  it("should drop non-Latin1 characters", () => {
    expect(normalizeSecretInput("abc“def”")).toBe("abcdef");
    expect(normalizeSecretInput("key😊")).toBe("key");
  });

  it("should preserve spaces within the string", () => {
    expect(normalizeSecretInput("Bearer token")).toBe("Bearer token");
  });

  it("should return empty string for non-string inputs", () => {
    expect(normalizeSecretInput(null)).toBe("");
    expect(normalizeSecretInput(undefined)).toBe("");
    expect(normalizeSecretInput(123)).toBe("");
  });
});

describe("normalizeOptionalSecretInput", () => {
  it("should return undefined if normalized string is empty", () => {
    expect(normalizeOptionalSecretInput("   ")).toBeUndefined();
    expect(normalizeOptionalSecretInput(null)).toBeUndefined();
  });

  it("should return the normalized string if not empty", () => {
    expect(normalizeOptionalSecretInput(" Bearer token\n ")).toBe("Bearer token");
  });
});
