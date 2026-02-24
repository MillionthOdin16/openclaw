import { describe, expect, it } from "vitest";
import {
  clampInt,
  clampNumber,
  escapeRegExp,
  isRecord,
  isSelfChatMode,
  safeParseJson,
  sliceUtf16Safe,
  truncateUtf16Safe,
} from "./utils.js";

describe("clampNumber", () => {
  it("clamps value within range", () => {
    expect(clampNumber(5, 0, 10)).toBe(5);
  });

  it("clamps value to min if below range", () => {
    expect(clampNumber(-5, 0, 10)).toBe(0);
  });

  it("clamps value to max if above range", () => {
    expect(clampNumber(15, 0, 10)).toBe(10);
  });
});

describe("clampInt", () => {
  it("clamps integer value within range", () => {
    expect(clampInt(5, 0, 10)).toBe(5);
  });

  it("clamps and floors float value", () => {
    expect(clampInt(5.9, 0, 10)).toBe(5);
  });

  it("clamps to min if below range", () => {
    expect(clampInt(-5.5, 0, 10)).toBe(0);
  });

  it("clamps to max if above range", () => {
    expect(clampInt(15.5, 0, 10)).toBe(10);
  });
});

describe("escapeRegExp", () => {
  it("escapes special regex characters", () => {
    expect(escapeRegExp("foo.*+?^${}()|[]\\bar")).toBe(
      "foo\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\bar",
    );
  });

  it("returns string as is if no special characters", () => {
    expect(escapeRegExp("foobar")).toBe("foobar");
  });
});

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("returns null for invalid JSON", () => {
    expect(safeParseJson("invalid")).toBeNull();
  });
});

describe("isRecord", () => {
  it("returns true for plain object", () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it("returns false for array", () => {
    expect(isRecord([1, 2])).toBe(false);
  });

  it("returns false for null", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("returns false for primitive", () => {
    expect(isRecord("string")).toBe(false);
    expect(isRecord(123)).toBe(false);
  });
});

describe("isSelfChatMode", () => {
  it("returns true when self number is in allowFrom", () => {
    expect(isSelfChatMode("+1234567890", ["+1234567890"])).toBe(true);
  });

  it("returns true with different formats", () => {
    expect(isSelfChatMode("+1234567890", ["1234567890"])).toBe(true);
  });

  it("returns false when self number is not in allowFrom", () => {
    expect(isSelfChatMode("+1234567890", ["+0987654321"])).toBe(false);
  });

  it("returns false when self number is missing", () => {
    expect(isSelfChatMode(null, ["+1234567890"])).toBe(false);
  });

  it("returns false when allowFrom is empty or invalid", () => {
    expect(isSelfChatMode("+1234567890", [])).toBe(false);
    expect(isSelfChatMode("+1234567890", null)).toBe(false);
  });

  it("returns false when allowFrom contains wildcard *", () => {
    expect(isSelfChatMode("+1234567890", ["*"])).toBe(false);
  });
});

describe("sliceUtf16Safe", () => {
  it("slices basic string correctly", () => {
    expect(sliceUtf16Safe("hello", 0, 2)).toBe("he");
  });

  it("keeps surrogate pair together when slice point is between them", () => {
    const emoji = "😀"; // High: D83D, Low: DE00
    // "a" + emoji + "b"
    // indices: 0: 'a', 1: high, 2: low, 3: 'b'
    const str = `a${emoji}b`;

    // Attempt to slice ending in middle of emoji (at index 2)
    // Should extend to include the full emoji (to index 3) if implementation is safe?
    // Wait, let's check implementation behavior from memory or re-read:
    // If end is between high and low, it decrements `to` by 1.
    // If start is between high and low, it increments `from` by 1.

    // Testing start inside emoji
    // slice(2) starts at low surrogate. Should bump to 3 ('b')
    expect(sliceUtf16Safe(str, 2)).toBe("b");

    // Testing end inside emoji
    // slice(0, 2) ends at low surrogate. Should bump back to 1 ('a')
    expect(sliceUtf16Safe(str, 0, 2)).toBe("a");
  });

  it("swaps start and end if start > end", () => {
    expect(sliceUtf16Safe("hello", 2, 0)).toBe("he");
  });

  it("handles negative indices", () => {
    expect(sliceUtf16Safe("hello", -2)).toBe("lo");
  });
});

describe("truncateUtf16Safe", () => {
  it("truncates string to length", () => {
    expect(truncateUtf16Safe("hello", 2)).toBe("he");
  });

  it("returns original string if length is within limit", () => {
    expect(truncateUtf16Safe("hello", 10)).toBe("hello");
  });

  it("truncates safely avoiding splitting surrogate pairs", () => {
    const emoji = "😀";
    // "a" + emoji
    // length 3 (1 char + 2 chars)
    const str = `a${emoji}`;

    // limit 2: 'a' + high surrogate. Should truncate to 'a'.
    expect(truncateUtf16Safe(str, 2)).toBe("a");

    // limit 3: exact length
    expect(truncateUtf16Safe(str, 3)).toBe(str);
  });
});
