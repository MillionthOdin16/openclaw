import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  normalizeWindowsPathForComparison,
  isNodeError,
  hasNodeErrorCode,
  isNotFoundPathError,
  isSymlinkOpenError,
  isPathInside,
} from "./path-guards.ts";

describe("path-guards", () => {
  describe("normalizeWindowsPathForComparison", () => {
    it("should normalize windows paths correctly", () => {
      expect(normalizeWindowsPathForComparison("C:\\Users\\test")).toBe("c:\\users\\test");
      expect(normalizeWindowsPathForComparison("C:/Users/test")).toBe("c:\\users\\test");
      expect(normalizeWindowsPathForComparison("\\\\?\\C:\\Users\\test")).toBe("c:\\users\\test");
      expect(normalizeWindowsPathForComparison("\\\\?\\UNC\\Server\\Share")).toBe(
        "\\\\server\\share",
      );
    });
  });

  describe("isNodeError", () => {
    it("should return true for errors with a code", () => {
      const err = new Error("test");
      (err as unknown as NodeJS.ErrnoException).code = "ENOENT";
      expect(isNodeError(err)).toBe(true);
    });

    it("should return false for regular errors", () => {
      const err = new Error("test");
      expect(isNodeError(err)).toBe(false);
    });

    it("should return false for non-objects", () => {
      expect(isNodeError(null)).toBe(false);
      expect(isNodeError(undefined)).toBe(false);
      expect(isNodeError("string")).toBe(false);
    });
  });

  describe("hasNodeErrorCode", () => {
    it("should return true if code matches", () => {
      const err = new Error("test");
      (err as unknown as NodeJS.ErrnoException).code = "ENOENT";
      expect(hasNodeErrorCode(err, "ENOENT")).toBe(true);
    });

    it("should return false if code does not match", () => {
      const err = new Error("test");
      (err as unknown as NodeJS.ErrnoException).code = "ENOENT";
      expect(hasNodeErrorCode(err, "EACCES")).toBe(false);
    });
  });

  describe("isNotFoundPathError", () => {
    it("should return true for ENOENT and ENOTDIR", () => {
      const err1 = new Error("test");
      (err1 as unknown as NodeJS.ErrnoException).code = "ENOENT";
      expect(isNotFoundPathError(err1)).toBe(true);

      const err2 = new Error("test");
      (err2 as unknown as NodeJS.ErrnoException).code = "ENOTDIR";
      expect(isNotFoundPathError(err2)).toBe(true);
    });

    it("should return false for other codes", () => {
      const err = new Error("test");
      (err as unknown as NodeJS.ErrnoException).code = "EACCES";
      expect(isNotFoundPathError(err)).toBe(false);
    });
  });

  describe("isSymlinkOpenError", () => {
    it("should return true for ELOOP, EINVAL, ENOTSUP", () => {
      ["ELOOP", "EINVAL", "ENOTSUP"].forEach((code) => {
        const err = new Error("test");
        (err as unknown as NodeJS.ErrnoException).code = code;
        expect(isSymlinkOpenError(err)).toBe(true);
      });
    });

    it("should return false for other codes", () => {
      const err = new Error("test");
      (err as unknown as NodeJS.ErrnoException).code = "EACCES";
      expect(isSymlinkOpenError(err)).toBe(false);
    });
  });

  describe("isPathInside", () => {
    let originalPlatform: string;

    beforeEach(() => {
      originalPlatform = process.platform;
    });

    afterEach(() => {
      Object.defineProperty(process, "platform", { value: originalPlatform });
    });

    it("should return true if target is inside root (posix)", () => {
      Object.defineProperty(process, "platform", { value: "linux" });
      expect(isPathInside("/root", "/root/child")).toBe(true);
      expect(isPathInside("/root/path", "/root/path/child/grandchild")).toBe(true);
    });

    it("should return true if target is the same as root (posix)", () => {
      Object.defineProperty(process, "platform", { value: "linux" });
      expect(isPathInside("/root", "/root")).toBe(true);
      expect(isPathInside("/root/", "/root")).toBe(true);
    });

    it("should return false if target is outside root (posix)", () => {
      Object.defineProperty(process, "platform", { value: "linux" });
      expect(isPathInside("/root", "/other/path")).toBe(false);
      expect(isPathInside("/root/path", "/root")).toBe(false);
      expect(isPathInside("/root", "/root-sibling")).toBe(false);
    });

    it("should return true if target is inside root (win32)", () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      expect(isPathInside("C:\\root", "C:\\root\\child")).toBe(true);
      expect(isPathInside("C:\\root\\path", "C:\\root\\path\\child\\grandchild")).toBe(true);
    });

    it("should return true if target is the same as root (win32)", () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      expect(isPathInside("C:\\root", "C:\\root")).toBe(true);
      expect(isPathInside("C:\\root\\", "C:\\root")).toBe(true);
    });

    it("should return false if target is outside root (win32)", () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      expect(isPathInside("C:\\root", "C:\\other\\path")).toBe(false);
      expect(isPathInside("C:\\root\\path", "C:\\root")).toBe(false);
      expect(isPathInside("C:\\root", "C:\\root-sibling")).toBe(false);
    });
  });
});
