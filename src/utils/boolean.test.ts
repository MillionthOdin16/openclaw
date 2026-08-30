import { describe, expect, test } from "vitest";
import { parseBooleanValue } from "./boolean.js";

describe("parseBooleanValue", () => {
  test("returns boolean directly", () => {
    expect(parseBooleanValue(true)).toBe(true);
    expect(parseBooleanValue(false)).toBe(false);
  });

  test("returns undefined for non-string, non-boolean values", () => {
    expect(parseBooleanValue(123)).toBeUndefined();
    expect(parseBooleanValue(null)).toBeUndefined();
    expect(parseBooleanValue(undefined)).toBeUndefined();
    expect(parseBooleanValue({})).toBeUndefined();
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
    expect(parseBooleanValue(" TRUE ")).toBe(true);
    expect(parseBooleanValue("YeS")).toBe(true);
  });

  test("parses default falsy values", () => {
    expect(parseBooleanValue("false")).toBe(false);
    expect(parseBooleanValue("0")).toBe(false);
    expect(parseBooleanValue("no")).toBe(false);
    expect(parseBooleanValue("off")).toBe(false);
    expect(parseBooleanValue(" FALSE ")).toBe(false);
    expect(parseBooleanValue("OfF")).toBe(false);
  });

  test("returns undefined for unrecognized string values", () => {
    expect(parseBooleanValue("maybe")).toBeUndefined();
    expect(parseBooleanValue("ok")).toBeUndefined();
  });

  test("supports custom truthy and falsy values", () => {
    const options = {
      truthy: ["yup", "ok"],
      falsy: ["nope", "nah"],
    };

    expect(parseBooleanValue("yup", options)).toBe(true);
    expect(parseBooleanValue("ok", options)).toBe(true);
    expect(parseBooleanValue("nope", options)).toBe(false);
    expect(parseBooleanValue("nah", options)).toBe(false);

    // Default values shouldn't work anymore
    expect(parseBooleanValue("true", options)).toBeUndefined();
    expect(parseBooleanValue("false", options)).toBeUndefined();
  });

  test("supports overriding only truthy values", () => {
    const options = {
      truthy: ["oui"],
    };

    expect(parseBooleanValue("oui", options)).toBe(true);
    expect(parseBooleanValue("true", options)).toBeUndefined();

    // Default falsy values should still work
    expect(parseBooleanValue("false", options)).toBe(false);
  });
});
