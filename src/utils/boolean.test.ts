import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("returns the boolean if already a boolean", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("returns undefined for non-string, non-boolean values", () => {
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
  });

  it("returns undefined for empty strings or strings with only whitespace", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
  });

  it("parses default truthy values correctly", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
  });

  it("parses default falsy values correctly", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(parseBooleanValue("  TRUE  ")).toBe(true);
    expect(parseBooleanValue("Yes")).toBe(true);
    expect(parseBooleanValue(" FALSE ")).toBe(false);
    expect(parseBooleanValue("No")).toBe(false);
  });

  it("returns undefined for strings that do not match truthy or falsy", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("2")).toBeUndefined();
    expect(parseBooleanValue("TRUEish")).toBeUndefined();
  });

  it("uses custom truthy and falsy options", () => {
    const options = { truthy: ["yep", "affirmative"], falsy: ["nope", "negative"] };

    expect(parseBooleanValue("yep", options)).toBe(true);
    expect(parseBooleanValue("affirmative", options)).toBe(true);

    expect(parseBooleanValue("nope", options)).toBe(false);
    expect(parseBooleanValue("negative", options)).toBe(false);

    expect(parseBooleanValue("true", options)).toBeUndefined();
    expect(parseBooleanValue("false", options)).toBeUndefined();
  });
});
