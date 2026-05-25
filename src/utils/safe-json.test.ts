import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("stringifies basic types correctly", () => {
    expect(safeJsonStringify("test")).toBe('"test"');
    expect(safeJsonStringify(123)).toBe("123");
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(null)).toBe("null");
  });

  it("stringifies objects and arrays", () => {
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
    expect(safeJsonStringify([1, "two", false])).toBe('[1,"two",false]');
  });

  it("handles BigInt values", () => {
    expect(safeJsonStringify({ val: 123n })).toBe('{"val":"123"}');
  });

  it("handles functions", () => {
    expect(safeJsonStringify({ func: () => {} })).toBe('{"func":"[Function]"}');
  });

  it("handles Error objects", () => {
    const err = new Error("test error");
    const json = safeJsonStringify({ error: err })!;
    const parsed = JSON.parse(json);
    expect(parsed.error.name).toBe("Error");
    expect(parsed.error.message).toBe("test error");
    expect(typeof parsed.error.stack).toBe("string");
  });

  it("handles Uint8Array", () => {
    const arr = new Uint8Array([1, 2, 3]);
    const json = safeJsonStringify(arr)!;
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe("Uint8Array");
    expect(parsed.data).toBe(Buffer.from(arr).toString("base64"));
  });

  it("returns null for circular references", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
