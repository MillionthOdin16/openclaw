import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies standard JSON objects", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
  });

  it("stringifies BigInt as string", () => {
    expect(safeJsonStringify({ b: 123n })).toBe('{"b":"123"}');
  });

  it("stringifies functions as [Function]", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("stringifies Error objects", () => {
    const err = new Error("test error");
    const result = safeJsonStringify({ err });
    expect(result).toContain('"message":"test error"');
    expect(result).toContain('"name":"Error"');
  });

  it("stringifies Uint8Array as base64", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const result = safeJsonStringify({ arr });
    expect(result).toContain('"type":"Uint8Array"');
    expect(result).toContain('"data":"AQID"');
  });

  it("returns null on circular references or JSON.stringify throw", () => {
    const circular: any = {};
    circular.self = circular;
    // JSON.stringify will throw on circular reference, returning null.
    expect(safeJsonStringify(circular)).toBeNull();
  });
});
