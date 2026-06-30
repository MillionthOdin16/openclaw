import { describe, test, expect } from "vitest";
import { safeJsonStringify } from "./safe-json.ts";

describe("safeJsonStringify", () => {
  test("handles basic types", () => {
    expect(safeJsonStringify("test")).toBe('"test"');
    expect(safeJsonStringify(123)).toBe("123");
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(null)).toBe("null");
  });

  test("handles objects and arrays", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
    expect(safeJsonStringify([1, 2, 3])).toBe("[1,2,3]");
  });

  test("handles bigint", () => {
    expect(safeJsonStringify({ val: 123n })).toBe('{"val":"123"}');
  });

  test("handles functions", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  test("handles Errors", () => {
    const error = new Error("test error");
    error.name = "CustomError";
    error.stack = "stack trace";
    expect(safeJsonStringify(error)).toBe(
      '{"name":"CustomError","message":"test error","stack":"stack trace"}',
    );
  });

  test("handles Uint8Array", () => {
    const data = new Uint8Array([1, 2, 3]);
    expect(safeJsonStringify(data)).toBe('{"type":"Uint8Array","data":"AQID"}');
  });

  test("returns null on circular references", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
