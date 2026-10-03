import { describe, it, expect } from "vitest";
import { isReasoningTagProvider } from "./provider-utils.ts";

describe("isReasoningTagProvider", () => {
  it("should return false for null or undefined", () => {
    expect(isReasoningTagProvider(null)).toBe(false);
    expect(isReasoningTagProvider(undefined)).toBe(false);
    expect(isReasoningTagProvider("")).toBe(false);
  });

  it("should return true for known google providers", () => {
    expect(isReasoningTagProvider("google")).toBe(true);
    expect(isReasoningTagProvider("google-gemini-cli")).toBe(true);
    expect(isReasoningTagProvider("google-generative-ai")).toBe(true);
    expect(isReasoningTagProvider("  GOOGLE  ")).toBe(true);
  });

  it("should return true for providers containing minimax", () => {
    expect(isReasoningTagProvider("minimax")).toBe(true);
    expect(isReasoningTagProvider("custom-minimax-provider")).toBe(true);
  });

  it("should return false for ollama or other providers", () => {
    expect(isReasoningTagProvider("ollama")).toBe(false);
    expect(isReasoningTagProvider("openai")).toBe(false);
    expect(isReasoningTagProvider("anthropic")).toBe(false);
  });
});
