import { describe, expect, it } from "vitest";
import { isReasoningTagProvider } from "./provider-utils.js";

describe("isReasoningTagProvider", () => {
  it("returns false for falsy values", () => {
    expect(isReasoningTagProvider(undefined)).toBe(false);
    expect(isReasoningTagProvider(null)).toBe(false);
    expect(isReasoningTagProvider("")).toBe(false);
  });

  it("returns true for Google providers", () => {
    expect(isReasoningTagProvider("google")).toBe(true);
    expect(isReasoningTagProvider("Google")).toBe(true);
    expect(isReasoningTagProvider("google-gemini-cli")).toBe(true);
    expect(isReasoningTagProvider("GOOGLE-GENERATIVE-AI")).toBe(true);
  });

  it("returns true for Minimax providers", () => {
    expect(isReasoningTagProvider("minimax")).toBe(true);
    expect(isReasoningTagProvider("some-minimax-model")).toBe(true);
  });

  it("returns false for non-reasoning tag providers", () => {
    expect(isReasoningTagProvider("openai")).toBe(false);
    expect(isReasoningTagProvider("anthropic")).toBe(false);
    expect(isReasoningTagProvider("ollama")).toBe(false); // Explicitly excluded in comments
  });
});
