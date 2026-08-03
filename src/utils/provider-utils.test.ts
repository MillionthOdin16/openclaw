import { describe, expect, it } from 'vitest';
import { isReasoningTagProvider } from './provider-utils';

describe('isReasoningTagProvider', () => {
  it('returns false for null/undefined/empty', () => {
    expect(isReasoningTagProvider(null)).toBe(false);
    expect(isReasoningTagProvider(undefined)).toBe(false);
    expect(isReasoningTagProvider('')).toBe(false);
    expect(isReasoningTagProvider('   ')).toBe(false);
  });

  it('returns true for known reasoning providers', () => {
    expect(isReasoningTagProvider('google')).toBe(true);
    expect(isReasoningTagProvider('GOOGLE')).toBe(true);
    expect(isReasoningTagProvider('google-gemini-cli')).toBe(true);
    expect(isReasoningTagProvider('google-generative-ai')).toBe(true);
    expect(isReasoningTagProvider('minimax')).toBe(true);
    expect(isReasoningTagProvider('some-minimax-model')).toBe(true);
  });

  it('returns false for other providers like ollama or openai', () => {
    expect(isReasoningTagProvider('ollama')).toBe(false);
    expect(isReasoningTagProvider('openai')).toBe(false);
    expect(isReasoningTagProvider('anthropic')).toBe(false);
  });
});
