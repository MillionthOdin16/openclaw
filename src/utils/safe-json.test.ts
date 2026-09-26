import { describe, it, expect } from "vitest";
import { safeJsonStringify } from "./safe-json.ts";

describe("safeJsonStringify", () => {
  it("stringifies regular objects", () => {
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
  });

  it("handles bigint", () => {
    expect(safeJsonStringify({ value: 9007199254740991n })).toBe('{"value":"9007199254740991"}');
  });

  it("handles functions", () => {
    expect(safeJsonStringify({ func: () => {} })).toBe('{"func":"[Function]"}');
  });

  it("handles Error objects", () => {
    const error = new Error("Test error");
    error.name = "CustomError";
    // Mock the stack for predictability
    error.stack = "Error: Test error\n    at <anonymous>:1:1";
    expect(safeJsonStringify({ err: error })).toBe('{"err":{"name":"CustomError","message":"Test error","stack":"Error: Test error\\n    at <anonymous>:1:1"}}');
  });

  it("handles Uint8Array", () => {
    const array = new Uint8Array([1, 2, 3]);
    expect(safeJsonStringify({ data: array })).toBe('{"data":{"type":"Uint8Array","data":"AQID"}}');
  });

  it("handles circular references gracefully", () => {
    const obj: any = {};
    obj.circular = obj;
    // JSON.stringify will throw on circular refs, so it should return null
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
