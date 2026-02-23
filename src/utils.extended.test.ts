import fs from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  clampInt,
  clampNumber,
  escapeRegExp,
  formatTerminalLink,
  isRecord,
  isSelfChatMode,
  pathExists,
  safeParseJson,
  sliceUtf16Safe,
  truncateUtf16Safe,
} from "./utils.js";

describe("clampNumber", () => {
  it("clamps value within range", () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
  });

  it("clamps value below min", () => {
    expect(clampNumber(-5, 0, 10)).toBe(0);
  });

  it("clamps value above max", () => {
    expect(clampNumber(15, 0, 10)).toBe(10);
  });
});

describe("clampInt", () => {
  it("floors and clamps value", () => {
    expect(clampInt(5.9, 0, 10)).toBe(5);
    expect(clampInt(-0.1, 0, 10)).toBe(0);
    expect(clampInt(10.1, 0, 10)).toBe(10);
  });
});

describe("escapeRegExp", () => {
  it("escapes special regex characters", () => {
    expect(escapeRegExp("foo.bar*baz?")).toBe("foo\\.bar\\*baz\\?");
    expect(escapeRegExp("(foo|bar)")).toBe("\\(foo\\|bar\\)");
    expect(escapeRegExp("[abc]")).toBe("\\[abc\\]");
    expect(escapeRegExp("{1,2}")).toBe("\\{1,2\\}");
    expect(escapeRegExp("^$")).toBe("\\^\\$");
    expect(escapeRegExp("\\")).toBe("\\\\");
  });

  it("leaves normal strings alone", () => {
    expect(escapeRegExp("abc123")).toBe("abc123");
  });
});

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"foo":"bar"}')).toEqual({ foo: "bar" });
    expect(safeParseJson("123")).toBe(123);
    expect(safeParseJson("true")).toBe(true);
    expect(safeParseJson("null")).toBe(null);
  });

  it("returns null for invalid JSON", () => {
    expect(safeParseJson("{foo:bar}")).toBeNull();
    expect(safeParseJson("undefined")).toBeNull();
    expect(safeParseJson("")).toBeNull();
  });
});

describe("isRecord", () => {
  it("returns true for plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ foo: "bar" })).toBe(true);
  });

  it("returns false for arrays", () => {
    expect(isRecord([])).toBe(false);
  });

  it("returns false for null", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isRecord("string")).toBe(false);
    expect(isRecord(123)).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe("isSelfChatMode", () => {
  it("returns false if selfE164 is missing", () => {
    expect(isSelfChatMode(null, ["+123"])).toBe(false);
    expect(isSelfChatMode(undefined, ["+123"])).toBe(false);
    expect(isSelfChatMode("", ["+123"])).toBe(false);
  });

  it("returns false if allowFrom is invalid", () => {
    expect(isSelfChatMode("+123", null)).toBe(false);
    expect(isSelfChatMode("+123", [])).toBe(false);
  });

  it("returns true if selfE164 is in allowFrom", () => {
    expect(isSelfChatMode("+123", ["+123"])).toBe(true);
    expect(isSelfChatMode("+123", ["+456", "+123"])).toBe(true);
  });

  it("returns false if selfE164 is not in allowFrom", () => {
    expect(isSelfChatMode("+123", ["+456"])).toBe(false);
  });

  it("normalizes phone numbers", () => {
    expect(isSelfChatMode("whatsapp:+123", ["+123"])).toBe(true);
    expect(isSelfChatMode("+123", ["whatsapp:+123"])).toBe(true);
    expect(isSelfChatMode("(123) 456-7890", ["+1234567890"])).toBe(true);
    expect(isSelfChatMode("1234567890", ["+1234567890"])).toBe(true);
  });

  it("explicitly rejects wildcard '*'", () => {
    expect(isSelfChatMode("+123", ["*"])).toBe(false);
  });

  it("ignores invalid entries in allowFrom", () => {
    expect(isSelfChatMode("+123", ["invalid", "+123"])).toBe(true);
  });
});

describe("sliceUtf16Safe", () => {
  it("slices normal strings correctly", () => {
    expect(sliceUtf16Safe("hello", 1, 3)).toBe("el");
    expect(sliceUtf16Safe("hello", 0)).toBe("hello");
    expect(sliceUtf16Safe("hello", 2)).toBe("llo");
  });

  it("handles start > end by swapping", () => {
    expect(sliceUtf16Safe("hello", 3, 1)).toBe("el");
  });

  it("handles negative indices", () => {
    expect(sliceUtf16Safe("hello", -2)).toBe("lo");
    expect(sliceUtf16Safe("hello", -3, -1)).toBe("ll");
  });

  it("preserves surrogate pairs (emojis)", () => {
    const cat = "😺";
    expect(sliceUtf16Safe(cat, 1)).toBe("");
    expect(sliceUtf16Safe(cat, 0, 1)).toBe("");

    const s = "a😺b";
    expect(sliceUtf16Safe(s, 1, 2)).toBe("");
    expect(sliceUtf16Safe(s, 1, 3)).toBe("😺");
  });
});

describe("truncateUtf16Safe", () => {
  it("truncates normal strings", () => {
    expect(truncateUtf16Safe("hello", 3)).toBe("hel");
    expect(truncateUtf16Safe("hello", 10)).toBe("hello");
  });

  it("prevents splitting surrogate pairs", () => {
    const s = "a😺b";
    expect(truncateUtf16Safe(s, 2)).toBe("a");
    expect(truncateUtf16Safe(s, 3)).toBe("a😺");
  });
});

describe("pathExists", () => {
  it("returns true if path exists", async () => {
    const accessSpy = vi.spyOn(fs.promises, "access").mockResolvedValue(undefined);
    expect(await pathExists("/some/path")).toBe(true);
    accessSpy.mockRestore();
  });

  it("returns false if path does not exist", async () => {
    const accessSpy = vi.spyOn(fs.promises, "access").mockRejectedValue(new Error("ENOENT"));
    expect(await pathExists("/some/path")).toBe(false);
    accessSpy.mockRestore();
  });
});

describe("formatTerminalLink", () => {
  it("returns fallback when not forced and not TTY", () => {
    const originalIsTTY = process.stdout.isTTY;
    process.stdout.isTTY = false;
    expect(formatTerminalLink("Click here", "http://example.com")).toBe("Click here (http://example.com)");
    process.stdout.isTTY = originalIsTTY;
  });

  it("returns ANSI code when forced", () => {
    expect(formatTerminalLink("Click here", "http://example.com", { force: true })).toBe(
      "\u001b]8;;http://example.com\u0007Click here\u001b]8;;\u0007"
    );
  });

  it("uses custom fallback", () => {
     expect(formatTerminalLink("Click here", "http://example.com", { fallback: "LINK" })).toBe("LINK");
  });
});
