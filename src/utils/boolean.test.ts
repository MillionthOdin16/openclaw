import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.ts";

describe("parseBooleanValue", () => {
  it("should return the exact boolean value if passed", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("should return undefined for non-string, non-boolean values", () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(undefined)).toBeUndefined();
  });

  it("should return undefined for empty string or whitespace", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
    expect(parseBooleanValue("\n\t")).toBeUndefined();
  });

  it("should return true for default truthy values", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);

    // with whitespace and mixed casing
    expect(parseBooleanValue("  TrUe  ")).toBe(true);
    expect(parseBooleanValue("YES\n")).toBe(true);
  });

  it("should return false for default falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);

    // with whitespace and mixed casing
    expect(parseBooleanValue("  fAlSe  ")).toBe(false);
    expect(parseBooleanValue("No\n")).toBe(false);
  });

  it("should return undefined for unhandled strings", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("2")).toBeUndefined();
    expect(parseBooleanValue("on/off")).toBeUndefined();
  });

  it("should support custom truthy values", () => {
    expect(parseBooleanValue("yep", { truthy: ["yep"] })).toBe(true);
    expect(parseBooleanValue("true", { truthy: ["yep"] })).toBeUndefined(); // default overridden
  });

  it("should support custom falsy values", () => {
    expect(parseBooleanValue("nope", { falsy: ["nope"] })).toBe(false);
    expect(parseBooleanValue("false", { falsy: ["nope"] })).toBeUndefined(); // default overridden
  });
});
