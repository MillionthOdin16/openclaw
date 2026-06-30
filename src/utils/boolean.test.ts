import { describe, test, expect } from "vitest";
import { parseBooleanValue } from "./boolean.ts";

describe("parseBooleanValue", () => {
  test("returns boolean directly", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  test("returns undefined for non-strings and non-booleans", () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue([])).toBeUndefined();
  });

  test("returns undefined for empty strings", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
  });

  test("parses default truthy values", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue("TRUE")).toBe(true);
    expect(parseBooleanValue(" Yes ")).toBe(true);
  });

  test("parses default falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue("FALSE")).toBe(false);
    expect(parseBooleanValue(" No ")).toBe(false);
  });

  test("returns undefined for unknown strings", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("2")).toBeUndefined();
  });

  test("parses custom truthy values", () => {
    expect(parseBooleanValue("yep", { truthy: ["yep"] })).toBe(true);
    expect(parseBooleanValue("true", { truthy: ["yep"] })).toBeUndefined();
  });

  test("parses custom falsy values", () => {
    expect(parseBooleanValue("nope", { falsy: ["nope"] })).toBe(false);
    expect(parseBooleanValue("false", { falsy: ["nope"] })).toBeUndefined();
  });
});
