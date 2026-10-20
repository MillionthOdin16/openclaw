import { describe, expect, it } from 'vitest';
import { parseBooleanValue } from './boolean.js';

describe('parseBooleanValue', () => {
  it('should return boolean directly if already boolean', () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it('should return undefined for non-string, non-boolean values', () => {
    expect(parseBooleanValue(1)).toBe(undefined);
    expect(parseBooleanValue(null)).toBe(undefined);
    expect(parseBooleanValue({})).toBe(undefined);
  });

  it('should return undefined for empty string or whitespace', () => {
    expect(parseBooleanValue('')).toBe(undefined);
    expect(parseBooleanValue('   ')).toBe(undefined);
  });

  it('should parse default truthy values', () => {
    expect(parseBooleanValue('true')).toBe(true);
    expect(parseBooleanValue('1')).toBe(true);
    expect(parseBooleanValue('yes')).toBe(true);
    expect(parseBooleanValue('on')).toBe(true);
    expect(parseBooleanValue(' TRUE ')).toBe(true); // check trim and case
  });

  it('should parse default falsy values', () => {
    expect(parseBooleanValue('false')).toBe(false);
    expect(parseBooleanValue('0')).toBe(false);
    expect(parseBooleanValue('no')).toBe(false);
    expect(parseBooleanValue('off')).toBe(false);
    expect(parseBooleanValue(' FALSE ')).toBe(false); // check trim and case
  });

  it('should return undefined for unknown string values', () => {
    expect(parseBooleanValue('maybe')).toBe(undefined);
    expect(parseBooleanValue('foo')).toBe(undefined);
  });

  it('should use custom truthy and falsy options if provided', () => {
    expect(parseBooleanValue('yep', { truthy: ['yep'] })).toBe(true);
    expect(parseBooleanValue('nope', { falsy: ['nope'] })).toBe(false);
    // When custom arrays are provided, defaults shouldn't match if omitted
    expect(parseBooleanValue('true', { truthy: ['yep'] })).toBe(undefined);
  });

  it('should only use custom truthy and leave falsy default', () => {
    expect(parseBooleanValue('yep', { truthy: ['yep'] })).toBe(true);
    expect(parseBooleanValue('false', { truthy: ['yep'] })).toBe(false);
  });

  it('should only use custom falsy and leave truthy default', () => {
    expect(parseBooleanValue('true', { falsy: ['nope'] })).toBe(true);
    expect(parseBooleanValue('nope', { falsy: ['nope'] })).toBe(false);
  });
});
