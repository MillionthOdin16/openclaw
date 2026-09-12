import { describe, it, expect } from 'vitest';
import { safeJsonStringify } from './safe-json';

describe('safeJsonStringify', () => {
  it('stringifies regular JSON objects', () => {
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
  });

  it('handles bigints', () => {
    expect(safeJsonStringify({ val: 12345678901234567890n })).toBe('{"val":"12345678901234567890"}');
  });

  it('handles functions', () => {
    expect(safeJsonStringify({ func: () => {} })).toBe('{"func":"[Function]"}');
  });

  it('handles Error objects', () => {
    const err = new Error("test error");
    const json = safeJsonStringify(err) as string;
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe("Error");
    expect(parsed.message).toBe("test error");
    expect(typeof parsed.stack).toBe("string");
  });

  it('handles Uint8Array', () => {
    const arr = new Uint8Array([1, 2, 3]);
    const json = safeJsonStringify(arr) as string;
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe("Uint8Array");
    expect(parsed.data).toBe(Buffer.from(arr).toString("base64"));
  });

  it('returns null on circular references without throwing', () => {
    const obj: any = {};
    obj.circular = obj;
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
