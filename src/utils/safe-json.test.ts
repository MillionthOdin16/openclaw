import { describe, it, expect } from "vitest";
import { safeJsonStringify } from "./safe-json.ts";

describe("safeJsonStringify", () => {
  it("should stringify simple objects", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
  });

  it("should stringify bigints as strings", () => {
    expect(safeJsonStringify({ a: 1n })).toBe('{"a":"1"}');
  });

  it("should stringify functions as '[Function]'", () => {
    expect(safeJsonStringify({ a: () => {} })).toBe('{"a":"[Function]"}');
  });

  it("should stringify errors correctly", () => {
    const err = new Error("test");
    const jsonStr = safeJsonStringify({ err }) as string;
    const parsed = JSON.parse(jsonStr);
    expect(parsed.err.name).toBe("Error");
    expect(parsed.err.message).toBe("test");
    expect(parsed.err.stack).toBeDefined();
  });

  it("should stringify Uint8Arrays as base64", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const jsonStr = safeJsonStringify({ arr }) as string;
    const parsed = JSON.parse(jsonStr);
    expect(parsed.arr.type).toBe("Uint8Array");
    expect(parsed.arr.data).toBe("AQID");
  });

  it("should return null on circular references or JSON stringify throw", () => {
    const obj: any = {};
    obj.circular = obj;
    // JSON.stringify handles bigints if replacer is there, but circular triggers throw
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
