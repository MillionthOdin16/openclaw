import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies basic types", () => {
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
  });

  it("stringifies bigints as strings", () => {
    expect(safeJsonStringify({ val: 123n })).toBe('{"val":"123"}');
  });

  it("stringifies functions as '[Function]'", () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
  });

  it("stringifies Error objects", () => {
    const err = new Error("oops");
    const parsed = JSON.parse(safeJsonStringify(err) as string);
    expect(parsed.name).toBe("Error");
    expect(parsed.message).toBe("oops");
    expect(typeof parsed.stack).toBe("string");
  });

  it("stringifies Uint8Array as base64", () => {
    const arr = new Uint8Array([1, 2, 3]);
    expect(safeJsonStringify(arr)).toBe('{"type":"Uint8Array","data":"AQID"}');
  });

  it("returns null on circular reference", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
