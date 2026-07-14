import { describe, expect, it } from "vitest";
import { tryParseLogLevel, normalizeLogLevel, levelToMinLevel } from "./levels.js";

describe("levels", () => {
  describe("tryParseLogLevel", () => {
    it("returns parsed log level for valid strings", () => {
      expect(tryParseLogLevel("info")).toBe("info");
      expect(tryParseLogLevel("debug")).toBe("debug");
      expect(tryParseLogLevel("fatal")).toBe("fatal");
      expect(tryParseLogLevel("error")).toBe("error");
      expect(tryParseLogLevel("warn")).toBe("warn");
      expect(tryParseLogLevel("trace")).toBe("trace");
      expect(tryParseLogLevel("silent")).toBe("silent");
    });

    it("trims whitespace from valid strings", () => {
      expect(tryParseLogLevel("  info  ")).toBe("info");
      expect(tryParseLogLevel("\tdebug\n")).toBe("debug");
    });

    it("returns undefined for invalid strings", () => {
      expect(tryParseLogLevel("invalid")).toBeUndefined();
      expect(tryParseLogLevel("")).toBeUndefined();
      expect(tryParseLogLevel("   ")).toBeUndefined();
    });

    it("returns undefined for non-string values", () => {
      expect(tryParseLogLevel(undefined)).toBeUndefined();
      expect(tryParseLogLevel(null as unknown as string)).toBeUndefined();
      expect(tryParseLogLevel(123 as unknown as string)).toBeUndefined();
    });
  });

  describe("normalizeLogLevel", () => {
    it("returns parsed level if valid", () => {
      expect(normalizeLogLevel("debug")).toBe("debug");
    });

    it("returns default fallback 'info' if invalid and no fallback provided", () => {
      expect(normalizeLogLevel("invalid")).toBe("info");
      expect(normalizeLogLevel(undefined)).toBe("info");
    });

    it("returns provided fallback if invalid", () => {
      expect(normalizeLogLevel("invalid", "warn")).toBe("warn");
      expect(normalizeLogLevel(undefined, "error")).toBe("error");
    });
  });

  describe("levelToMinLevel", () => {
    it("maps log levels to correct numeric values", () => {
      expect(levelToMinLevel("fatal")).toBe(0);
      expect(levelToMinLevel("error")).toBe(1);
      expect(levelToMinLevel("warn")).toBe(2);
      expect(levelToMinLevel("info")).toBe(3);
      expect(levelToMinLevel("debug")).toBe(4);
      expect(levelToMinLevel("trace")).toBe(5);
      expect(levelToMinLevel("silent")).toBe(Number.POSITIVE_INFINITY);
    });
  });
});
