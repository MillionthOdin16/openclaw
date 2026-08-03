import { describe, expect, it } from 'vitest';
import { safeJsonStringify } from './safe-json';

describe('safeJsonStringify', () => {
  it('stringifies primitives', () => {
    expect(safeJsonStringify(1)).toBe('1');
    expect(safeJsonStringify('test')).toBe('"test"');
    expect(safeJsonStringify(true)).toBe('true');
    expect(safeJsonStringify(null)).toBe('null');
  });

  it('stringifies objects and arrays', () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
    expect(safeJsonStringify([1, 2])).toBe('[1,2]');
  });

  it('handles BigInt', () => {
    expect(safeJsonStringify(123n)).toBe('"123"');
  });

  it('handles functions', () => {
    expect(safeJsonStringify(() => {})).toBe('"[Function]"');
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it('handles Error objects', () => {
    const err = new Error('test error');
    const result = safeJsonStringify(err);
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"test error"');
    expect(result).toContain('"stack":');
  });

  it('handles Uint8Array', () => {
    const arr = new Uint8Array([1, 2, 3]);
    const result = safeJsonStringify(arr);
    expect(result).toBe('{"type":"Uint8Array","data":"AQID"}');
  });

  it('returns null on circular reference', () => {
    const obj: Record<string, unknown> = {};
    obj.a = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
