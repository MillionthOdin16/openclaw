import { describe, expect, it } from "vitest";
import { isReasoningTagProvider } from "./provider-utils.js";

describe("isReasoningTagProvider", () => {
  it("should return false for null, undefined, or empty string", () => {
    expect(isReasoningTagProvider(null)).toBe(false);
    expect(isReasoningTagProvider(undefined)).toBe(false);
    expect(isReasoningTagProvider("")).toBe(false);
    expect(isReasoningTagProvider("   ")).toBe(false); // only whitespace
  });

  it("should return true for google providers", () => {
    expect(isReasoningTagProvider("google")).toBe(true);
    expect(isReasoningTagProvider("google-gemini-cli")).toBe(true);
    expect(isReasoningTagProvider("google-generative-ai")).toBe(true);
    expect(isReasoningTagProvider("  Google  ")).toBe(true); // trimming and lowercasing
  });

  it("should return true for minimax providers", () => {
    expect(isReasoningTagProvider("minimax")).toBe(true);
    expect(isReasoningTagProvider("something-minimax-something")).toBe(true);
    expect(isReasoningTagProvider("MiniMax-v1")).toBe(true);
  });

  it("should return false for other providers like ollama or openai", () => {
    expect(isReasoningTagProvider("ollama")).toBe(false);
    expect(isReasoningTagProvider("openai")).toBe(false);
    expect(isReasoningTagProvider("anthropic")).toBe(false);
    expect(isReasoningTagProvider("unknown-provider")).toBe(false);
  });
});
