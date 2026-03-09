import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.ts";

describe("safeJsonStringify", () => {
  it("should stringify normal objects", () => {
    expect(safeJsonStringify({ a: 1, b: "2" })).toBe('{"a":1,"b":"2"}');
    expect(safeJsonStringify([1, 2, 3])).toBe("[1,2,3]");
  });

  it("should stringify bigint as string", () => {
    expect(safeJsonStringify({ val: 123n })).toBe('{"val":"123"}');
  });

  it("should stringify functions as '[Function]'", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("should stringify Error instances", () => {
    const error = new Error("Test error");
    const result = safeJsonStringify(error);
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"Test error"');
    expect(result).toContain('"stack":');
  });

  it("should stringify Uint8Array as base64", () => {
    const arr = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    expect(safeJsonStringify(arr)).toBe('{"type":"Uint8Array","data":"SGVsbG8="}');
  });

  it("should return null for circular references", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    // By default JSON.stringify throws on circular references,
    // and safeJsonStringify catches it and returns null.
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
