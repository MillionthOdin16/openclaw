import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies standard JSON values", () => {
    expect(safeJsonStringify({ a: 1, b: "two", c: true })).toBe('{"a":1,"b":"two","c":true}');
    expect(safeJsonStringify([1, 2, 3])).toBe("[1,2,3]");
    expect(safeJsonStringify("hello")).toBe('"hello"');
    expect(safeJsonStringify(123)).toBe("123");
    expect(safeJsonStringify(null)).toBe("null");
  });

  it("handles BigInts by converting them to strings", () => {
    expect(safeJsonStringify({ value: 123n })).toBe('{"value":"123"}');
  });

  it("handles functions by converting them to '[Function]'", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("handles Error objects by extracting name, message, and stack", () => {
    const error = new Error("test error");
    error.stack = "test stack";
    const result = safeJsonStringify({ err: error });
    expect(result).toBe('{"err":{"name":"Error","message":"test error","stack":"test stack"}}');
  });

  it("handles Uint8Array by converting to base64 object", () => {
    const arr = new Uint8Array([1, 2, 3]);
    expect(safeJsonStringify({ data: arr })).toBe('{"data":{"type":"Uint8Array","data":"AQID"}}');
  });

  it("returns null for circular references or unstringifiable objects", () => {
    const circular: any = {};
    circular.self = circular;
    expect(safeJsonStringify(circular)).toBeNull();
  });
});
