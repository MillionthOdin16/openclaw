import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies regular objects", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
  });

  it("handles bigints", () => {
    expect(safeJsonStringify({ val: 123n })).toBe('{"val":"123"}');
  });

  it("handles functions", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("handles errors", () => {
    const err = new Error("test error");
    const jsonStr = safeJsonStringify({ err })!;
    const parsed = JSON.parse(jsonStr);
    expect(parsed.err.name).toBe("Error");
    expect(parsed.err.message).toBe("test error");
    expect(typeof parsed.err.stack).toBe("string");
  });

  it("handles Uint8Array", () => {
    const arr = new Uint8Array([1, 2, 3]);
    expect(safeJsonStringify({ arr })).toBe('{"arr":{"type":"Uint8Array","data":"AQID"}}');
  });

  it("returns null on stringify failure", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj; // Circular reference
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
