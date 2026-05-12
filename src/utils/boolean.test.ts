import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("returns the boolean if passed a boolean", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("returns undefined for non-string, non-boolean inputs", () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
  });

  it("returns undefined for empty strings", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
  });

  it("handles default truthy values", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue("  TRUE  ")).toBe(true);
  });

  it("handles default falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue("  FALSE  ")).toBe(false);
  });

  it("returns undefined for unrecognised strings", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("2")).toBeUndefined();
  });

  it("supports custom truthy and falsy values", () => {
    expect(parseBooleanValue("yep", { truthy: ["yep"], falsy: ["nope"] })).toBe(true);
    expect(parseBooleanValue("nope", { truthy: ["yep"], falsy: ["nope"] })).toBe(false);
    expect(parseBooleanValue("true", { truthy: ["yep"], falsy: ["nope"] })).toBeUndefined();
  });
});
