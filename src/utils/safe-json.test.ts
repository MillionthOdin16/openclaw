import { describe, expect, test } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  test("stringifies simple objects", () => {
    expect(safeJsonStringify({ a: 1, b: "two", c: true })).toBe(
      '{"a":1,"b":"two","c":true}'
    );
  });

  test("handles BigInt values", () => {
    expect(safeJsonStringify({ big: 9007199254740991n })).toBe(
      '{"big":"9007199254740991"}'
    );
  });

  test("handles Functions", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  test("handles Errors", () => {
    const err = new Error("Test error");
    const jsonStr = safeJsonStringify({ error: err }) as string;
    expect(jsonStr).toContain('"name":"Error"');
    expect(jsonStr).toContain('"message":"Test error"');
    expect(jsonStr).toContain('"stack":');
  });

  test("handles Uint8Array", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const str = Buffer.from(arr).toString("base64");
    expect(safeJsonStringify({ data: arr })).toBe(
      `{"data":{"type":"Uint8Array","data":"${str}"}}`
    );
  });

  test("handles circular references gracefully", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
