import { describe, it, expect } from "vitest";
import {
  decodeJsonPointerToken,
  encodeJsonPointerToken,
  readJsonPointer,
  setJsonPointer,
} from "./json-pointer.js";

describe("decodeJsonPointerToken", () => {
  it("decodes ~1 to / and ~0 to ~", () => {
    expect(decodeJsonPointerToken("foo~1bar~0baz")).toBe("foo/bar~baz");
    expect(decodeJsonPointerToken("~1~0~1")).toBe("/~/");
  });
});

describe("encodeJsonPointerToken", () => {
  it("encodes / to ~1 and ~ to ~0", () => {
    expect(encodeJsonPointerToken("foo/bar~baz")).toBe("foo~1bar~0baz");
    expect(encodeJsonPointerToken("/~/")).toBe("~1~0~1");
  });
});

describe("readJsonPointer", () => {
  const data = {
    foo: ["bar", "baz"],
    "": 0,
    "a/b": 1,
    "c%d": 2,
    "e^f": 3,
    "g|h": 4,
    "i\\j": 5,
    "k\"l": 6,
    " ": 7,
    "m~n": 8,
  };

  it("reads simple properties", () => {
    expect(readJsonPointer(data, "/foo")).toEqual(["bar", "baz"]);
  });

  it("reads array elements", () => {
    expect(readJsonPointer(data, "/foo/0")).toBe("bar");
    expect(readJsonPointer(data, "/foo/1")).toBe("baz");
  });

  it("reads empty keys", () => {
    expect(readJsonPointer(data, "/")).toBe(0);
  });

  it("reads encoded keys", () => {
    expect(readJsonPointer(data, "/a~1b")).toBe(1);
    expect(readJsonPointer(data, "/m~0n")).toBe(8);
  });

  it("fails if not starting with /", () => {
    expect(() => readJsonPointer(data, "foo")).toThrow(
      'File-backed secret ids must be absolute JSON pointers (for example: "/providers/openai/apiKey").',
    );
  });

  it("returns undefined instead of throwing invalid pointer error if not starting with / when onMissing=undefined", () => {
    expect(readJsonPointer(data, "foo", { onMissing: "undefined" })).toBeUndefined();
  });

  it("fails when array index is out of bounds", () => {
    expect(() => readJsonPointer(data, "/foo/2")).toThrow('JSON pointer segment "2" is out of bounds.');
    expect(() => readJsonPointer(data, "/foo/not-a-number")).toThrow('JSON pointer segment "not-a-number" is out of bounds.');
  });

  it("returns undefined when array index is out of bounds with onMissing=undefined", () => {
    expect(readJsonPointer(data, "/foo/2", { onMissing: "undefined" })).toBeUndefined();
  });

  it("fails when accessing non-existent key in an object", () => {
    expect(() => readJsonPointer(data, "/bar")).toThrow('JSON pointer segment "bar" does not exist.');
  });

  it("returns undefined when accessing non-existent key with onMissing=undefined", () => {
    expect(readJsonPointer(data, "/bar", { onMissing: "undefined" })).toBeUndefined();
  });

  it("fails when traversing through non-objects", () => {
    expect(() => readJsonPointer(data, "/foo/0/invalid")).toThrow('JSON pointer segment "invalid" does not exist.');
    expect(() => readJsonPointer(null, "/foo")).toThrow('JSON pointer segment "foo" does not exist.');
  });

  it("returns undefined when traversing through non-objects with onMissing=undefined", () => {
    expect(readJsonPointer(data, "/foo/0/invalid", { onMissing: "undefined" })).toBeUndefined();
  });

  it("fails when pointing to missing property in object", () => {
    const obj: any = Object.create(null); // No prototype
    expect(() => readJsonPointer(obj, "/bar")).toThrow('JSON pointer segment "bar" does not exist.');
  });

  it("fails when pointing to property on prototype", () => {
    const obj = {};
    expect(() => readJsonPointer(obj, "/toString")).toThrow('JSON pointer segment "toString" does not exist.');
  });
});

describe("setJsonPointer", () => {
  it("sets a simple property in an object", () => {
    const obj: any = {};
    setJsonPointer(obj, "/foo", "bar");
    expect(obj).toEqual({ foo: "bar" });
  });

  it("sets a nested property in an object, creating objects along the way", () => {
    const obj: any = {};
    setJsonPointer(obj, "/foo/bar", "baz");
    expect(obj).toEqual({ foo: { bar: "baz" } });
  });

  it("sets an array element", () => {
    const obj: any = { foo: ["bar"] };
    setJsonPointer(obj, "/foo/0", "baz");
    expect(obj.foo[0]).toBe("baz");
  });

  it("overrides primitives with object structure", () => {
    const obj: any = { foo: "bar" };
    setJsonPointer(obj, "/foo/bar", "baz");
    expect(obj).toEqual({ foo: { bar: "baz" } });
  });

  it("overrides arrays with objects when passing through (due to typeof child checks)", () => {
    const obj: any = { foo: [] };
    setJsonPointer(obj, "/foo/0", "bar");
    expect(obj).toEqual({ foo: { "0": "bar" } });
  });

  it("handles null values during traversal and creates an object", () => {
    const obj: any = { foo: null };
    setJsonPointer(obj, "/foo/bar", "baz");
    expect(obj).toEqual({ foo: { bar: "baz" } });
  });

  it("fails if not starting with /", () => {
    const obj = {};
    expect(() => setJsonPointer(obj, "foo", "bar")).toThrow('Invalid JSON pointer "foo".');
  });
});
