import { describe, expect, it } from "vitest";
import { levelToMinLevel, normalizeLogLevel, tryParseLogLevel } from "./levels.js";

describe("tryParseLogLevel", () => {
  it("returns undefined for non-string inputs", () => {
    expect(tryParseLogLevel(undefined)).toBeUndefined();
    expect(tryParseLogLevel(null as unknown as string)).toBeUndefined();
    expect(tryParseLogLevel(123 as unknown as string)).toBeUndefined();
  });

  it("trims and parses valid log levels", () => {
    expect(tryParseLogLevel("info")).toBe("info");
    expect(tryParseLogLevel("  warn  ")).toBe("warn");
    expect(tryParseLogLevel("debug")).toBe("debug");
    expect(tryParseLogLevel("silent")).toBe("silent");
  });

  it("returns undefined for invalid log levels", () => {
    expect(tryParseLogLevel("")).toBeUndefined();
    expect(tryParseLogLevel("   ")).toBeUndefined();
    expect(tryParseLogLevel("invalid")).toBeUndefined();
    expect(tryParseLogLevel("INFO")).toBeUndefined(); // case sensitive
  });
});

describe("normalizeLogLevel", () => {
  it("returns the parsed level if valid", () => {
    expect(normalizeLogLevel("error")).toBe("error");
    expect(normalizeLogLevel("  trace  ")).toBe("trace");
  });

  it("returns the default fallback (info) for invalid levels when no fallback provided", () => {
    expect(normalizeLogLevel("invalid")).toBe("info");
    expect(normalizeLogLevel(undefined)).toBe("info");
  });

  it("returns the custom fallback for invalid levels", () => {
    expect(normalizeLogLevel("invalid", "warn")).toBe("warn");
    expect(normalizeLogLevel(undefined, "debug")).toBe("debug");
  });
});

describe("levelToMinLevel", () => {
  it("returns correct numerical values for each level", () => {
    expect(levelToMinLevel("fatal")).toBe(0);
    expect(levelToMinLevel("error")).toBe(1);
    expect(levelToMinLevel("warn")).toBe(2);
    expect(levelToMinLevel("info")).toBe(3);
    expect(levelToMinLevel("debug")).toBe(4);
    expect(levelToMinLevel("trace")).toBe(5);
    expect(levelToMinLevel("silent")).toBe(Number.POSITIVE_INFINITY);
  });
});
