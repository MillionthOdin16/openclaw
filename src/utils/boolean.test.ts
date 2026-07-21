import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("should return the value if it's already a boolean", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("should return undefined if the value is not a boolean or string", () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(undefined)).toBeUndefined();
  });

  it("should return undefined if the value is an empty string", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
  });

  it("should parse truthy values correctly", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue(" TRUE ")).toBe(true);
  });

  it("should parse falsy values correctly", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue("  fAlSe ")).toBe(false);
  });

  it("should return undefined for unrecognized strings", () => {
    expect(parseBooleanValue("random")).toBeUndefined();
    expect(parseBooleanValue("maybe")).toBeUndefined();
  });

  it("should respect custom truthy options", () => {
    expect(parseBooleanValue("y", { truthy: ["y", "t"] })).toBe(true);
    expect(parseBooleanValue("t", { truthy: ["y", "t"] })).toBe(true);
    expect(parseBooleanValue("true", { truthy: ["y", "t"] })).toBeUndefined();
  });

  it("should respect custom falsy options", () => {
    expect(parseBooleanValue("n", { falsy: ["n", "f"] })).toBe(false);
    expect(parseBooleanValue("f", { falsy: ["n", "f"] })).toBe(false);
    expect(parseBooleanValue("false", { falsy: ["n", "f"] })).toBeUndefined();
  });
});
