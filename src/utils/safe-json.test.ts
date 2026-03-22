import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("should stringify primitives", () => {
    expect(safeJsonStringify(1)).toBe("1");
    expect(safeJsonStringify("string")).toBe('"string"');
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(null)).toBe("null");
    expect(safeJsonStringify(undefined)).toBe(undefined); // JSON.stringify(undefined) is undefined
  });

  it("should stringify objects and arrays", () => {
    expect(safeJsonStringify({ a: 1, b: "2" })).toBe('{"a":1,"b":"2"}');
    expect(safeJsonStringify([1, "2", true])).toBe('[1,"2",true]');
  });

  it("should stringify bigints as strings", () => {
    expect(safeJsonStringify({ val: 9007199254740991n })).toBe('{"val":"9007199254740991"}');
  });

  it("should stringify functions as '[Function]'", () => {
    expect(safeJsonStringify({ fn: () => {} })).toBe('{"fn":"[Function]"}');
    expect(safeJsonStringify({ fn: function test() {} })).toBe('{"fn":"[Function]"}');
  });

  it("should stringify Error objects", () => {
    const error = new Error("Test error message");
    const result = safeJsonStringify({ err: error });
    expect(result).toContain('"name":"Error"');
    expect(result).toContain('"message":"Test error message"');
    expect(result).toContain('"stack":');
  });

  it("should stringify Uint8Array to base64", () => {
    const data = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
    const expectedBase64 = Buffer.from(data).toString("base64");
    expect(safeJsonStringify({ bytes: data })).toBe(
      `{"bytes":{"type":"Uint8Array","data":"${expectedBase64}"}}`,
    );
  });

  it("should return null for circular references", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBe(null);
  });

  it("should return null if an error is thrown during stringification", () => {
    const obj = {
      get getterThatThrows() {
        throw new Error("Boom");
      },
    };
    expect(safeJsonStringify(obj)).toBe(null);
  });
});
