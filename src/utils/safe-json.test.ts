import { describe, it, expect } from 'vitest';
import { safeJsonStringify } from './safe-json';

describe('safeJsonStringify', () => {
  it('should stringify basic primitives and objects', () => {
    expect(safeJsonStringify({ a: 1, b: 'two', c: true })).toBe('{"a":1,"b":"two","c":true}');
    expect(safeJsonStringify(null)).toBe('null');
    expect(safeJsonStringify([1, 2, 3])).toBe('[1,2,3]');
  });

  it('should stringify bigint as string', () => {
    expect(safeJsonStringify({ val: 10n })).toBe('{"val":"10"}');
  });

  it('should stringify function as "[Function]"', () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it('should stringify Error objects', () => {
    const err = new Error('test error');
    const result = safeJsonStringify({ err });
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"test error"');
    expect(result).toContain('"stack":');
  });

  it('should stringify Uint8Array to base64', () => {
    const arr = new Uint8Array([1, 2, 3]);
    const result = safeJsonStringify({ arr });
    expect(result).toBe('{"arr":{"type":"Uint8Array","data":"AQID"}}');
  });

  it('should return null for circular references', () => {
    const obj = {};
    (obj as unknown as Record<string, unknown>).self = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
