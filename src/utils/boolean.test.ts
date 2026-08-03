import { describe, expect, it } from 'vitest';
import { parseBooleanValue } from './boolean';

describe('parseBooleanValue', () => {
  it('returns boolean if passed boolean', () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it('returns undefined for non-strings and empty strings', () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(undefined)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue('')).toBeUndefined();
    expect(parseBooleanValue('   ')).toBeUndefined();
  });

  it('parses default truthy values', () => {
    expect(parseBooleanValue('true')).toBe(true);
    expect(parseBooleanValue('1')).toBe(true);
    expect(parseBooleanValue('yes')).toBe(true);
    expect(parseBooleanValue('on')).toBe(true);
    expect(parseBooleanValue(' TRUE ')).toBe(true);
  });

  it('parses default falsy values', () => {
    expect(parseBooleanValue('false')).toBe(false);
    expect(parseBooleanValue('0')).toBe(false);
    expect(parseBooleanValue('no')).toBe(false);
    expect(parseBooleanValue('off')).toBe(false);
    expect(parseBooleanValue(' FALSE ')).toBe(false);
  });

  it('returns undefined for unknown strings', () => {
    expect(parseBooleanValue('maybe')).toBeUndefined();
    expect(parseBooleanValue('hello')).toBeUndefined();
  });

  it('uses custom options', () => {
    const options = { truthy: ['yep'], falsy: ['nope'] };
    expect(parseBooleanValue('yep', options)).toBe(true);
    expect(parseBooleanValue('nope', options)).toBe(false);
    expect(parseBooleanValue('true', options)).toBeUndefined();
    expect(parseBooleanValue('false', options)).toBeUndefined();
  });
});
