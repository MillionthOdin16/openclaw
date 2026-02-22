import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("handles basic primitives", () => {
    expect(safeJsonStringify("hello")).toBe('"hello"');
    expect(safeJsonStringify(123)).toBe("123");
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(false)).toBe("false");
    expect(safeJsonStringify(null)).toBe("null");
  });

  it("handles objects and arrays", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
    expect(safeJsonStringify([1, 2])).toBe("[1,2]");
  });

  it("handles BigInt", () => {
    expect(safeJsonStringify(BigInt(123))).toBe('"123"');
    expect(safeJsonStringify({ val: BigInt(456) })).toBe('{"val":"456"}');
  });

  it("handles Functions", () => {
    // Replaces function with "[Function]" string
    expect(safeJsonStringify(() => {})).toBe('"[Function]"');
  });

  it("handles Functions inside objects", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("handles Errors", () => {
    const err = new Error("msg");
    err.stack = "stack";
    // Error properties are not enumerable by default, but safeJsonStringify handles specific properties
    // However, JSON.stringify calls replacer for non-enumerable properties ONLY if they are explicitly passed? No.
    // JSON.stringify iterates over enumerable properties. Error properties are not enumerable.
    // BUT safeJsonStringify handles `val instanceof Error` specifically in the replacer.
    // If passed directly: `safeJsonStringify(err)` calls replacer with err. Replacer returns object.
    // If passed inside object: `safeJsonStringify({e: err})`. `e` is err. Replacer called.
    expect(safeJsonStringify(err)).toBe('{"name":"Error","message":"msg","stack":"stack"}');
  });

  it("handles Uint8Array", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const base64 = Buffer.from(arr).toString("base64");
    expect(safeJsonStringify(arr)).toBe(`{"type":"Uint8Array","data":"${base64}"}`);
  });

  it("handles undefined", () => {
    // Should return null (per type definition string | null), currently returns undefined
    expect(safeJsonStringify(undefined)).toBeNull();
  });

  it("handles circular references", () => {
    const a: any = {};
    a.self = a;
    // JSON.stringify throws on circular reference.
    // safeJsonStringify catches and returns null.
    expect(safeJsonStringify(a)).toBeNull();
  });
});
