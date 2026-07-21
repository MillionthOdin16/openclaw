import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("should stringify simple objects", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
  });

  it("should stringify bigints as strings", () => {
    expect(safeJsonStringify({ a: 1n })).toBe('{"a":"1"}');
  });

  it("should stringify functions as '[Function]'", () => {
    expect(safeJsonStringify({ a: () => {} })).toBe('{"a":"[Function]"}');
  });

  it("should stringify Errors correctly", () => {
    const err = new Error("test error");
    const result = safeJsonStringify({ err });
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"test error"');
    expect(result).toContain('"stack":');
  });

  it("should stringify Uint8Array to base64 object", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const result = safeJsonStringify({ arr });
    expect(result).toContain('"type":"Uint8Array"');
    expect(result).toContain('"data":"AQID"'); // base64 for [1,2,3]
  });

  it("should handle circular references gracefully by returning null", () => {
    const obj: Record<string, unknown> = {};
    obj.circular = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
