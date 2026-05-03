import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("should stringify simple objects", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
  });

  it("should handle bigint", () => {
    expect(safeJsonStringify({ val: 10n })).toBe('{"val":"10"}');
  });

  it("should handle function", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("should handle Error", () => {
    const err = new Error("test error");
    expect(safeJsonStringify({ err })).toContain('"message":"test error"');
  });

  it("should handle Uint8Array", () => {
    const arr = new Uint8Array([1, 2, 3]);
    expect(safeJsonStringify({ arr })).toContain('"type":"Uint8Array"');
  });

  it("should handle circular references gracefully by returning null", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a: any = {};
    a.a = a;
    expect(safeJsonStringify(a)).toBe(null);
  });
});
