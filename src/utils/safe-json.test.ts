import { describe, it, expect } from "vitest";
import { safeJsonStringify } from "./safe-json";

describe("safeJsonStringify", () => {
  it("should stringify simple objects", () => {
    const obj = { a: 1, b: "two", c: true, d: null };
    expect(safeJsonStringify(obj)).toBe('{"a":1,"b":"two","c":true,"d":null}');
  });

  it("should stringify arrays", () => {
    const arr = [1, "two", true, null];
    expect(safeJsonStringify(arr)).toBe('[1,"two",true,null]');
  });

  it("should handle bigint", () => {
    const obj = { val: 12345678901234567890n };
    expect(safeJsonStringify(obj)).toBe('{"val":"12345678901234567890"}');
  });

  it("should handle functions", () => {
    const obj = { fn: () => {} };
    expect(safeJsonStringify(obj)).toBe('{"fn":"[Function]"}');
  });

  it("should handle Error objects", () => {
    const err = new Error("Test error");
    err.name = "CustomError";
    err.stack = "Error: Test error\\n    at ...";
    const result = safeJsonStringify({ error: err });
    const parsed = JSON.parse(result as string);
    expect(parsed.error).toBeDefined();
    expect(parsed.error.name).toBe("CustomError");
    expect(parsed.error.message).toBe("Test error");
    expect(parsed.error.stack).toBe("Error: Test error\\n    at ...");
  });

  it("should handle Uint8Array", () => {
    const arr = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = safeJsonStringify(arr);
    const parsed = JSON.parse(result as string);
    expect(parsed.type).toBe("Uint8Array");
    // "Hello" in base64 is "SGVsbG8="
    expect(parsed.data).toBe("SGVsbG8=");
  });

  it("should return null on circular references or JSON.stringify failure", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
