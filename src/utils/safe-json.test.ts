import { describe, expect, it } from 'vitest';
import { safeJsonStringify } from './safe-json.js';

describe('safeJsonStringify', () => {
  it('stringifies simple objects', () => {
    expect(safeJsonStringify({ foo: 'bar', baz: 123 })).toBe('{"foo":"bar","baz":123}');
    expect(safeJsonStringify([1, 2, 3])).toBe('[1,2,3]');
    expect(safeJsonStringify('test')).toBe('"test"');
    expect(safeJsonStringify(123)).toBe('123');
    expect(safeJsonStringify(true)).toBe('true');
    expect(safeJsonStringify(null)).toBe('null');
  });

  it('handles bigints correctly', () => {
    expect(safeJsonStringify({ val: 123n })).toBe('{"val":"123"}');
    expect(safeJsonStringify(123n)).toBe('"123"');
  });

  it('handles functions correctly', () => {
    expect(safeJsonStringify({ val: () => {} })).toBe('{"val":"[Function]"}');
    expect(safeJsonStringify(() => {})).toBe('"[Function]"');
  });

  it('handles Error objects correctly', () => {
    const error = new Error('test error');
    const result = safeJsonStringify({ val: error });
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"test error"');
    expect(result).toContain('"stack":');
  });

  it('handles Uint8Array correctly', () => {
    const data = new Uint8Array([1, 2, 3]);
    expect(safeJsonStringify({ data })).toBe('{"data":{"type":"Uint8Array","data":"AQID"}}');
  });

  it('returns null on circular references or stringify failures', () => {
    const obj = {} as Record<string, unknown>;
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
