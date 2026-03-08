import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json";

describe("safeJsonStringify", () => {
  it("stringifies primitive types", () => {
    expect(safeJsonStringify("hello")).toBe('"hello"');
    expect(safeJsonStringify(123)).toBe("123");
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(null)).toBe("null");
  });

  it("stringifies basic objects and arrays", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
    expect(safeJsonStringify([1, 2])).toBe("[1,2]");
  });

  it("stringifies bigint as string", () => {
    expect(safeJsonStringify({ val: 12345678901234567890n })).toBe(
      '{"val":"12345678901234567890"}',
    );
  });

  it("stringifies function as '[Function]'", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("stringifies Error with name, message, and stack", () => {
    const error = new Error("test error");
    error.stack = "Error: test error\n    at test.js"; // mock stack for deterministic test
    const json = safeJsonStringify(error);
    expect(json).toBe(
      '{"name":"Error","message":"test error","stack":"Error: test error\\n    at test.js"}',
    );
  });

  it("stringifies Uint8Array as base64", () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const json = safeJsonStringify({ data });
    expect(json).toBe('{"data":{"type":"Uint8Array","data":"SGVsbG8="}}');
  });

  it("returns null for circular references", () => {
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = {};
    obj.self = obj;
    // The base JSON.stringify throws for circular references.
    // However, our stringify logic will catch it.
    // But since the replacer doesn't remove the circular reference, it still throws inside JSON.stringify
    // which triggers the catch block, returning null.
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
