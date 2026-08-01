import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies standard JSON objects", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
  });

  it("handles bigint", () => {
    expect(safeJsonStringify({ a: 1n })).toBe('{"a":"1"}');
  });

  it("handles functions", () => {
    expect(safeJsonStringify({ a: () => {} })).toBe('{"a":"[Function]"}');
  });

  it("handles Error objects", () => {
    const err = new Error("test error");
    err.stack = "fake stack";
    const result = safeJsonStringify(err);
    expect(result).toBe('{"name":"Error","message":"test error","stack":"fake stack"}');
  });

  it("handles Uint8Array", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const expectedBase64 = Buffer.from(arr).toString("base64");
    expect(safeJsonStringify(arr)).toBe(`{"type":"Uint8Array","data":"${expectedBase64}"}`);
  });

  it("returns null on circular references or errors", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
