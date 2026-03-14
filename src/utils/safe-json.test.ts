import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies standard JSON objects", () => {
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
    expect(safeJsonStringify([1, 2, 3])).toBe("[1,2,3]");
    expect(safeJsonStringify(null)).toBe("null");
  });

  it("handles BigInt values", () => {
    expect(safeJsonStringify({ val: 9007199254740991n })).toBe('{"val":"9007199254740991"}');
  });

  it("handles functions", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("handles Errors", () => {
    const err = new Error("test error");
    const jsonStr = safeJsonStringify({ err });
    expect(jsonStr).toContain('"name":"Error"');
    expect(jsonStr).toContain('"message":"test error"');
    expect(jsonStr).toContain('"stack":');
  });

  it("handles Uint8Array values", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const jsonStr = safeJsonStringify({ bytes });
    expect(jsonStr).toContain('"type":"Uint8Array"');
    // "Hello" -> "SGVsbG8=" in base64
    expect(jsonStr).toContain('"data":"SGVsbG8="');
  });

  it("returns null for circular references", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.b = obj; // circular ref
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
