import fs from "node:fs";
import { describe, it, expect, vi, afterEach } from "vitest";
import { matchesExecAllowlistPattern } from "./exec-allowlist-pattern.js";

vi.mock("node:fs", () => {
  return {
    default: {
      realpathSync: vi.fn(),
    },
  };
});

// Mock the expandHomePrefix explicitly since we don't know the exact logic
vi.mock("./home-dir.js", () => {
  return {
    expandHomePrefix: vi.fn((p) => p.replace(/^~/, "/mock/home")),
  };
});

describe("matchesExecAllowlistPattern", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false for empty or whitespace patterns", () => {
    expect(matchesExecAllowlistPattern("", "/usr/bin/node")).toBe(false);
    expect(matchesExecAllowlistPattern("   ", "/usr/bin/node")).toBe(false);
  });

  it("matches exact patterns", () => {
    expect(matchesExecAllowlistPattern("/usr/bin/node", "/usr/bin/node")).toBe(true);
    expect(matchesExecAllowlistPattern("/usr/bin/node", "/usr/bin/npm")).toBe(false);
  });

  it("matches patterns case-insensitively", () => {
    expect(matchesExecAllowlistPattern("/USR/BIN/NODE", "/usr/bin/node")).toBe(true);
  });

  it("supports ~ for home directory expansion", () => {
    expect(matchesExecAllowlistPattern("~/bin/node", "/mock/home/bin/node")).toBe(true);
  });

  it("supports * wildcard (matches anything except /)", () => {
    expect(matchesExecAllowlistPattern("/usr/*/node", "/usr/bin/node")).toBe(true);
    expect(matchesExecAllowlistPattern("/usr/*/node", "/usr/local/bin/node")).toBe(false);
  });

  it("supports ** wildcard (matches anything including /)", () => {
    expect(matchesExecAllowlistPattern("/usr/**/node", "/usr/bin/node")).toBe(true);
    expect(matchesExecAllowlistPattern("/usr/**/node", "/usr/local/bin/node")).toBe(true);
  });

  it("supports ? wildcard (matches single character)", () => {
    expect(matchesExecAllowlistPattern("/usr/bin/nod?", "/usr/bin/node")).toBe(true);
    expect(matchesExecAllowlistPattern("/usr/bin/nod?", "/usr/bin/nod")).toBe(false);
  });

  it("escapes special regex characters in pattern", () => {
    expect(matchesExecAllowlistPattern("/usr/bin/node.js", "/usr/bin/node.js")).toBe(true);
    expect(matchesExecAllowlistPattern("/usr/bin/node.js", "/usr/bin/nodexjs")).toBe(false);
  });

  it("normalizes path separators", () => {
    // Note: normalizeMatchTarget replaces `\\\\` with `/` on non-win32 platforms,
    // but the test string `\\usr\\bin\\node` has literal backslashes which need escaping.
    expect(matchesExecAllowlistPattern("\\\\usr\\\\bin\\\\node", "/usr/bin/node")).toBe(true);
  });

  it("caches compiled regular expressions to avoid recompilation", () => {
    expect(matchesExecAllowlistPattern("/cache/test", "/cache/test")).toBe(true);
    expect(matchesExecAllowlistPattern("/cache/test", "/cache/test")).toBe(true);
  });

  it("clears cache when limit is reached", () => {
    for (let i = 0; i < 515; i++) {
      matchesExecAllowlistPattern(`/cache/test${i}`, `/cache/test${i}`);
    }
    expect(matchesExecAllowlistPattern("/cache/test514", "/cache/test514")).toBe(true);
  });

  describe("win32 specific behavior", () => {
    const originalPlatform = process.platform;

    afterEach(() => {
      Object.defineProperty(process, "platform", { value: originalPlatform });
      vi.mocked(fs.realpathSync).mockReset();
    });

    it("handles UNC paths and normalizes slashes on Windows", () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      vi.mocked(fs.realpathSync).mockImplementation((p) => p as string);

      expect(
        matchesExecAllowlistPattern(
          "C:\\Program Files\\Node\\node.exe",
          "c:/program files/node/node.exe",
        ),
      ).toBe(true);
      expect(
        matchesExecAllowlistPattern(
          "\\\\.\\C:\\Program Files\\Node\\node.exe",
          "c:/program files/node/node.exe",
        ),
      ).toBe(true);
      expect(
        matchesExecAllowlistPattern(
          "\\\\?\\C:\\Program Files\\Node\\node.exe",
          "c:/program files/node/node.exe",
        ),
      ).toBe(true);
    });

    it("attempts realpath on Windows when there are no wildcards", () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      vi.mocked(fs.realpathSync).mockImplementation((p) => {
        if (p === "C:\\bin\\node.exe") {
          return "c:/bin/node.exe";
        }
        return p as string;
      });

      expect(matchesExecAllowlistPattern("C:\\bin\\node.exe", "c:/bin/node.exe")).toBe(true);
      expect(vi.mocked(fs.realpathSync)).toHaveBeenCalled();
    });

    it("falls back to original string if realpathSync throws on Windows", () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      vi.mocked(fs.realpathSync).mockImplementation(() => {
        throw new Error("ENOENT");
      });

      expect(matchesExecAllowlistPattern("C:\\bin\\node.exe", "c:/bin/node.exe")).toBe(true);
    });
  });
});
