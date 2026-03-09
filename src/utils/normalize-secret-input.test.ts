import { describe, expect, it } from "vitest";
import { normalizeOptionalSecretInput, normalizeSecretInput } from "./normalize-secret-input.ts";

describe("normalizeSecretInput", () => {
  it("should strip line breaks and trim outer whitespaces", () => {
    expect(normalizeSecretInput("  my\r\nsecret\ntoken\r  ")).toBe("mysecrettoken");
  });

  it("should preserve inner spaces", () => {
    expect(normalizeSecretInput("  Bearer \r\n myToken123  ")).toBe("Bearer  myToken123");
  });

  it("should return an empty string if passed a non-string", () => {
    expect(normalizeSecretInput(null)).toBe("");
    expect(normalizeSecretInput(123)).toBe("");
    expect(normalizeSecretInput({})).toBe("");
  });

  it("should return an empty string if passed an empty string", () => {
    expect(normalizeSecretInput("")).toBe("");
    expect(normalizeSecretInput("   ")).toBe("");
  });
});

describe("normalizeOptionalSecretInput", () => {
  it("should return normalized string if not empty", () => {
    expect(normalizeOptionalSecretInput("  my\r\nsecret\ntoken\r  ")).toBe("mysecrettoken");
  });

  it("should return undefined if empty", () => {
    expect(normalizeOptionalSecretInput("")).toBeUndefined();
    expect(normalizeOptionalSecretInput("   ")).toBeUndefined();
    expect(normalizeOptionalSecretInput(null)).toBeUndefined();
  });
});
