import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("should stringify standard JSON types correctly", () => {
    expect(safeJsonStringify("string")).toBe('"string"');
    expect(safeJsonStringify(123)).toBe("123");
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(null)).toBe("null");
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
    expect(safeJsonStringify([1, "two", false])).toBe('[1,"two",false]');
  });

  it("should serialize bigints to strings", () => {
    // BigInt literal causes issues without target support, so using BigInt constructor
    expect(safeJsonStringify(BigInt(123))).toBe('"123"');
    expect(safeJsonStringify({ val: BigInt("9007199254740991") })).toBe('{"val":"9007199254740991"}');
  });

  it("should serialize functions to '[Function]'", () => {
    const myFunc = () => {};
    expect(safeJsonStringify(myFunc)).toBe('"[Function]"');
    expect(safeJsonStringify({ fn: myFunc })).toBe('{"fn":"[Function]"}');
  });

  it("should serialize Error objects to include name, message, and stack", () => {
    const err = new Error("something went wrong");
    const jsonStr = safeJsonStringify(err);
    expect(jsonStr).not.toBeNull();

    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      expect(parsed.name).toBe("Error");
      expect(parsed.message).toBe("something went wrong");
      expect(parsed.stack).toBeDefined();
    }
  });

  it("should serialize Uint8Array to base64", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in ascii
    const jsonStr = safeJsonStringify(bytes);
    expect(jsonStr).not.toBeNull();

    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      expect(parsed.type).toBe("Uint8Array");
      expect(parsed.data).toBe(Buffer.from(bytes).toString("base64"));
    }
  });

  it("should return null for circular references", () => {
    const obj: any = { a: 1 };
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBeNull();
  });
});
