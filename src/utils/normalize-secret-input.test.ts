import { describe, expect, it } from "vitest";
import { normalizeSecretInput, normalizeOptionalSecretInput } from "./normalize-secret-input.js";

describe("normalizeSecretInput", () => {
  it("should return empty string for non-string input", () => {
    expect(normalizeSecretInput(null)).toBe("");
    expect(normalizeSecretInput(123)).toBe("");
    expect(normalizeSecretInput({})).toBe("");
    expect(normalizeSecretInput(undefined)).toBe("");
  });

  it("should remove line breaks", () => {
    expect(normalizeSecretInput("test\nkey")).toBe("testkey");
    expect(normalizeSecretInput("test\rkey")).toBe("testkey");
    expect(normalizeSecretInput("test\r\nkey")).toBe("testkey");
    expect(normalizeSecretInput("test\u2028key")).toBe("testkey"); // Line separator
    expect(normalizeSecretInput("test\u2029key")).toBe("testkey"); // Paragraph separator
  });

  it("should strip non-Latin1 characters", () => {
    expect(normalizeSecretInput("test-key-“smart-quotes”")).toBe("test-key-smart-quotes"); // Quotes stripped
    expect(normalizeSecretInput("test✅key")).toBe("testkey");
    expect(normalizeSecretInput("key😀")).toBe("key");
  });

  it("should trim leading and trailing whitespace", () => {
    expect(normalizeSecretInput("  test-key  ")).toBe("test-key");
    expect(normalizeSecretInput("\t test-key \t")).toBe("test-key");
  });

  it("should preserve ordinary spaces inside the string", () => {
    expect(normalizeSecretInput("Bearer test-token")).toBe("Bearer test-token");
  });

  it("should handle a combination of whitespace, newlines and non-Latin1 characters", () => {
    expect(normalizeSecretInput(" \n Bearer \r test✅token \n ")).toBe("Bearer  testtoken");
  });
});

describe("normalizeOptionalSecretInput", () => {
  it("should return undefined if normalizeSecretInput returns an empty string", () => {
    expect(normalizeOptionalSecretInput("")).toBeUndefined();
    expect(normalizeOptionalSecretInput("   ")).toBeUndefined();
    expect(normalizeOptionalSecretInput(null)).toBeUndefined();
    expect(normalizeOptionalSecretInput("✅\n")).toBeUndefined();
  });

  it("should return the normalized string if it is not empty", () => {
    expect(normalizeOptionalSecretInput(" \n Bearer \r test✅token \n ")).toBe("Bearer  testtoken");
  });
});
