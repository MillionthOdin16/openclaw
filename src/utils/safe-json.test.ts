import { describe, expect, it } from 'vitest';
import { safeJsonStringify } from './safe-json.js';

describe('safeJsonStringify', () => {
  it('should stringify primitive types', () => {
    expect(safeJsonStringify(42)).toBe('42');
    expect(safeJsonStringify('test')).toBe('"test"');
    expect(safeJsonStringify(true)).toBe('true');
    expect(safeJsonStringify(null)).toBe('null');
  });

  it('should stringify objects and arrays', () => {
    expect(safeJsonStringify({ a: 1, b: [2, 3] })).toBe('{"a":1,"b":[2,3]}');
  });

  it('should stringify BigInt values as strings', () => {
    expect(safeJsonStringify({ val: 9007199254740991n })).toBe('{"val":"9007199254740991"}');
  });

  it('should stringify functions as "[Function]"', () => {
    expect(safeJsonStringify({ func: () => {} })).toBe('{"func":"[Function]"}');
  });

  it('should stringify Error objects', () => {
    const err = new Error('test error');
    const result = safeJsonStringify({ err }) as string;
    const parsed = JSON.parse(result);
    expect(parsed.err.name).toBe('Error');
    expect(parsed.err.message).toBe('test error');
    expect(typeof parsed.err.stack).toBe('string');
  });

  it('should stringify Uint8Array as base64', () => {
    const data = new Uint8Array([1, 2, 3]);
    const result = safeJsonStringify({ data }) as string;
    const parsed = JSON.parse(result);
    expect(parsed.data.type).toBe('Uint8Array');
    expect(typeof parsed.data.data).toBe('string');
    expect(parsed.data.data).toBe(Buffer.from(data).toString('base64'));
  });

  it('should handle circular references gracefully (return null)', () => {
    const obj: any = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
