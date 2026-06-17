import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("should stringify simple objects", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
  });

  it("should stringify bigints", () => {
    expect(safeJsonStringify({ val: 123n })).toBe('{"val":"123"}');
  });

  it("should stringify functions as [Function]", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("should stringify Errors", () => {
    const err = new Error("test error");
    const json = safeJsonStringify({ err });
    expect(json).toContain('"name":"Error"');
    expect(json).toContain('"message":"test error"');
    expect(json).toContain('"stack":');
  });

  it("should stringify Uint8Arrays", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const json = safeJsonStringify({ arr });
    expect(json).toBe('{"arr":{"type":"Uint8Array","data":"AQID"}}');
  });

  it("should return null for circular references", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
