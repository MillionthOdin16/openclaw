import { describe, expect, it } from 'vitest';
import { parseBooleanValue } from './boolean.js';

describe('boolean', () => {
  describe('parseBooleanValue', () => {
    it('returns true for boolean true', () => {
      expect(parseBooleanValue(true)).toBe(true);
    });

    it('returns false for boolean false', () => {
      expect(parseBooleanValue(false)).toBe(false);
    });

    it('returns undefined for non-string non-boolean types', () => {
      expect(parseBooleanValue(123)).toBeUndefined();
      expect(parseBooleanValue(null)).toBeUndefined();
      expect(parseBooleanValue({})).toBeUndefined();
      expect(parseBooleanValue([])).toBeUndefined();
    });

    it('returns undefined for empty strings', () => {
      expect(parseBooleanValue('')).toBeUndefined();
      expect(parseBooleanValue('   ')).toBeUndefined();
    });

    it('returns true for default truthy strings', () => {
      expect(parseBooleanValue('true')).toBe(true);
      expect(parseBooleanValue('1')).toBe(true);
      expect(parseBooleanValue('yes')).toBe(true);
      expect(parseBooleanValue('on')).toBe(true);

      // Case insensitivity and whitespace handling
      expect(parseBooleanValue('  TRUE  ')).toBe(true);
      expect(parseBooleanValue('Yes')).toBe(true);
    });

    it('returns false for default falsy strings', () => {
      expect(parseBooleanValue('false')).toBe(false);
      expect(parseBooleanValue('0')).toBe(false);
      expect(parseBooleanValue('no')).toBe(false);
      expect(parseBooleanValue('off')).toBe(false);

      // Case insensitivity and whitespace handling
      expect(parseBooleanValue('  FALSE  ')).toBe(false);
      expect(parseBooleanValue('No')).toBe(false);
    });

    it('returns undefined for unrecognized strings', () => {
      expect(parseBooleanValue('foo')).toBeUndefined();
      expect(parseBooleanValue('bar')).toBeUndefined();
      expect(parseBooleanValue('truthy')).toBeUndefined();
      expect(parseBooleanValue('falsy')).toBeUndefined();
    });

    it('respects custom truthy options', () => {
      expect(parseBooleanValue('yep', { truthy: ['yep'] })).toBe(true);
      expect(parseBooleanValue('true', { truthy: ['yep'] })).toBeUndefined(); // default overridden
    });

    it('respects custom falsy options', () => {
      expect(parseBooleanValue('nope', { falsy: ['nope'] })).toBe(false);
      expect(parseBooleanValue('false', { falsy: ['nope'] })).toBeUndefined(); // default overridden
    });
  });
});
