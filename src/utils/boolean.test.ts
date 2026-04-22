import { describe, expect, it } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  it("returns true for boolean true", () => {
    expect(parseBooleanValue(true)).toBe(true);
  });

  it("returns false for boolean false", () => {
    expect(parseBooleanValue(false)).toBe(false);
  });

  it("returns undefined for non-string, non-boolean values", () => {
    expect(parseBooleanValue(1)).toBe(undefined);
    expect(parseBooleanValue({})).toBe(undefined);
    expect(parseBooleanValue(null)).toBe(undefined);
    expect(parseBooleanValue(undefined)).toBe(undefined);
    expect(parseBooleanValue([])).toBe(undefined);
  });

  it("returns undefined for empty or whitespace strings", () => {
    expect(parseBooleanValue("")).toBe(undefined);
    expect(parseBooleanValue("   ")).toBe(undefined);
  });

  it("parses default truthy values correctly", () => {
    expect(parseBooleanValue("true")).toBe(true);
    expect(parseBooleanValue("TRUE")).toBe(true);
    expect(parseBooleanValue("  true  ")).toBe(true);
    expect(parseBooleanValue("1")).toBe(true);
    expect(parseBooleanValue("yes")).toBe(true);
    expect(parseBooleanValue("on")).toBe(true);
  });

  it("parses default falsy values correctly", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("FALSE")).toBe(false);
    expect(parseBooleanValue("  false  ")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
  });

  it("returns undefined for strings that are neither truthy nor falsy", () => {
    expect(parseBooleanValue("unknown")).toBe(undefined);
    expect(parseBooleanValue("t")).toBe(undefined);
    expect(parseBooleanValue("f")).toBe(undefined);
    expect(parseBooleanValue("2")).toBe(undefined);
  });

  it("uses custom truthy options when provided", () => {
    expect(parseBooleanValue("yep", { truthy: ["yep"] })).toBe(true);
    expect(parseBooleanValue("true", { truthy: ["yep"] })).toBe(undefined);
    expect(parseBooleanValue("false", { truthy: ["yep"] })).toBe(false);
  });

  it("uses custom falsy options when provided", () => {
    expect(parseBooleanValue("nope", { falsy: ["nope"] })).toBe(false);
    expect(parseBooleanValue("false", { falsy: ["nope"] })).toBe(undefined);
    expect(parseBooleanValue("true", { falsy: ["nope"] })).toBe(true);
  });
});
