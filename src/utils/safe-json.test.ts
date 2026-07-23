import { describe, it, expect } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("should stringify simple values correctly", () => {
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
  });

  it("should stringify bigints correctly", () => {
    expect(safeJsonStringify({ val: 123n })).toBe('{"val":"123"}');
  });

  it("should stringify functions correctly", () => {
    expect(safeJsonStringify({ val: () => {} })).toBe('{"val":"[Function]"}');
  });

  it("should stringify Error objects correctly", () => {
    const err = new Error("test error");
    const result = safeJsonStringify({ val: err });
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"test error"');
    expect(result).toContain('"stack":');
  });

  it("should stringify Uint8Array objects correctly", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const result = safeJsonStringify({ val: arr });
    expect(result).toContain('"type":"Uint8Array"');
    expect(result).toContain('"data":"AQID"'); // base64 of [1,2,3]
  });

  it("should return null for circular references", () => {
    const obj: Record<string, unknown> = {};
    obj.circular = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
