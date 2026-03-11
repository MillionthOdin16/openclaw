import { describe, expect, it } from "vitest";
import { safeJsonStringify } from "./safe-json.js";

describe("safeJsonStringify", () => {
  it("serializes basic primitive values and objects", () => {
    expect(safeJsonStringify(null)).toBe("null");
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(42)).toBe("42");
    expect(safeJsonStringify("hello")).toBe('"hello"');
    expect(safeJsonStringify({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
    expect(safeJsonStringify([1, "two", false])).toBe('[1,"two",false]');
  });

  it("serializes BigInt to string", () => {
    expect(safeJsonStringify(BigInt(42))).toBe('"42"');
    expect(safeJsonStringify({ value: BigInt(9007199254740991) })).toBe('{"value":"9007199254740991"}');
  });

  it("serializes Function to a string placeholder", () => {
    expect(safeJsonStringify(() => {})).toBe('"[Function]"');
    expect(safeJsonStringify({ fn: function() {} })).toBe('{"fn":"[Function]"}');
  });

  it("serializes Error objects with standard properties", () => {
    const error = new Error("Something went wrong");
    error.name = "CustomError";
    const result = safeJsonStringify(error);
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!);
    expect(parsed.name).toBe("CustomError");
    expect(parsed.message).toBe("Something went wrong");
    expect(typeof parsed.stack).toBe("string");
  });

  it("serializes Uint8Array to an object with base64 data", () => {
    const data = new Uint8Array([104, 101, 108, 108, 111]); // 'hello' in ASCII
    const result = safeJsonStringify(data);
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!);
    expect(parsed).toEqual({
      type: "Uint8Array",
      data: Buffer.from(data).toString("base64"),
    });
  });

  it("returns null on cyclical references", () => {
    const cyclicalObj: Record<string, unknown> = {};
    cyclicalObj.self = cyclicalObj;

    const result = safeJsonStringify(cyclicalObj);
    expect(result).toBeNull();
  });

  it("handles complex nested objects with all supported types", () => {
    const obj = {
      text: "hello",
      num: 10n,
      func: () => "test",
      error: new Error("Test error"),
      buffer: new Uint8Array([1, 2, 3]),
      nested: {
        array: [1, BigInt(2)],
      },
    };

    const result = safeJsonStringify(obj);
    expect(result).not.toBeNull();

    const parsed = JSON.parse(result!);
    expect(parsed.text).toBe("hello");
    expect(parsed.num).toBe("10");
    expect(parsed.func).toBe("[Function]");
    expect(parsed.error.message).toBe("Test error");
    expect(parsed.buffer.type).toBe("Uint8Array");
    expect(parsed.buffer.data).toBe(Buffer.from([1, 2, 3]).toString("base64"));
    expect(parsed.nested.array).toEqual([1, "2"]);
  });
});
