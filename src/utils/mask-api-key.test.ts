import { describe, expect, it } from 'vitest';
import { maskApiKey } from './mask-api-key.js';

describe('maskApiKey', () => {
  it('should return "missing" for empty or whitespace-only strings', () => {
    expect(maskApiKey('')).toBe('missing');
    expect(maskApiKey('   ')).toBe('missing');
  });

  it('should mask strings with length <= 6', () => {
    expect(maskApiKey('12345')).toBe('1...5');
    expect(maskApiKey('123456')).toBe('1...6');
    expect(maskApiKey(' a ')).toBe('a...a'); // Check trimmed behavior
  });

  it('should mask strings with length > 6 and <= 16', () => {
    expect(maskApiKey('1234567')).toBe('12...67');
    expect(maskApiKey('1234567890123456')).toBe('12...56');
  });

  it('should mask strings with length > 16', () => {
    expect(maskApiKey('12345678901234567')).toBe('12345678...01234567');
  });
});
