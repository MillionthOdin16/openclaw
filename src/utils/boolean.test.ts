import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("returns the boolean as-is if a boolean is passed", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("returns undefined for non-string, non-boolean values", () => {
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue([])).toBeUndefined();
  });

  it("returns undefined for empty strings or strings with only whitespace", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
    expect(parseBooleanValue("\n\t")).toBeUndefined();
  });

  it("parses default truthy string values", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
    expect(parseBooleanValue("  TRUE  ")).toBe(true); // check trimming & case insensitivity
    expect(parseBooleanValue("YeS")).toBe(true);
  });

  it("parses default falsy string values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue("  FALSE  ")).toBe(false); // check trimming & case insensitivity
    expect(parseBooleanValue("nO")).toBe(false);
  });

  it("returns undefined for unknown string values", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("unknown")).toBeUndefined();
    expect(parseBooleanValue("10")).toBeUndefined();
  });

  it("respects custom truthy options", () => {
    expect(parseBooleanValue("yep", { truthy: ["yep"] })).toBe(true);
    // When custom options are provided, defaults for that option are overridden
    expect(parseBooleanValue("true", { truthy: ["yep"] })).toBeUndefined();
  });

  it("respects custom falsy options", () => {
    expect(parseBooleanValue("nope", { falsy: ["nope"] })).toBe(false);
    // When custom options are provided, defaults for that option are overridden
    expect(parseBooleanValue("false", { falsy: ["nope"] })).toBeUndefined();
  });

  it("can use both custom truthy and falsy options", () => {
    const opts = { truthy: ["yep"], falsy: ["nope"] };
    expect(parseBooleanValue("yep", opts)).toBe(true);
    expect(parseBooleanValue("nope", opts)).toBe(false);
    expect(parseBooleanValue("true", opts)).toBeUndefined();
  });
});
