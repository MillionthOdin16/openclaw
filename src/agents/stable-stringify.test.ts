import { describe, it, expect } from "vitest";
import { stableStringify } from "./stable-stringify.js";

describe("stableStringify", () => {
  it("stringifies simple values", () => {
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(undefined)).toBe("null");
    expect(stableStringify(1)).toBe("1");
    expect(stableStringify("hello")).toBe('"hello"');
    expect(stableStringify(true)).toBe("true");
  });

  it("stringifies arrays", () => {
    expect(stableStringify([1, 2, 3])).toBe("[1,2,3]");
    expect(stableStringify(["a", "b"])).toBe('["a","b"]');
    expect(stableStringify([null, undefined])).toBe("[null,null]");
  });

  it("stringifies objects with stable keys", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(stableStringify({ z: null, y: undefined, x: 3 })).toBe('{"x":3,"y":null,"z":null}');
  });

  it("handles nested structures", () => {
    const obj = {
      nested: {
        arr: [3, 2, { z: "foo", a: "bar" }],
        b: 1,
      },
      a: "first"
    };
    expect(stableStringify(obj)).toBe('{"a":"first","nested":{"arr":[3,2,{"a":"bar","z":"foo"}],"b":1}}');
  });
});
