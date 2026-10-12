import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("should return true for boolean true", () => {
    expect(parseBooleanValue(true)).toBe(true);
  });

  it("should return false for boolean false", () => {
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("should return undefined for non-string, non-boolean values", () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(undefined)).toBeUndefined();
  });

  it("should return undefined for empty or whitespace strings", () => {
    expect(parseBooleanValue("")).toBeUndefined();
    expect(parseBooleanValue("   ")).toBeUndefined();
  });

  it("should return true for default truthy values", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
  });

  it("should return false for default falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
  });

  it("should be case-insensitive and ignore surrounding whitespace", () => {
    expect(parseBooleanValue("  TrUe  ")).toBe(true);
    expect(parseBooleanValue("  fAlSe  ")).toBe(false);
  });

  it("should return undefined for unrecognized string values", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("2")).toBeUndefined();
  });

  it("should use custom truthy and falsy values if provided", () => {
    const options = { truthy: ["yep", "affirmative"], falsy: ["nope", "negative"] };

    expect(parseBooleanValue("yep", options)).toBe(true);
    expect(parseBooleanValue("affirmative", options)).toBe(true);

    expect(parseBooleanValue("nope", options)).toBe(false);
    expect(parseBooleanValue("negative", options)).toBe(false);

    expect(parseBooleanValue("true", options)).toBeUndefined();
    expect(parseBooleanValue("false", options)).toBeUndefined();
  });
});
