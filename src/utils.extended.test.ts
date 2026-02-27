import { describe, expect, it } from "vitest";
import { isSelfChatMode, sliceUtf16Safe, truncateUtf16Safe } from "./utils.js";

describe("sliceUtf16Safe", () => {
  it("slices standard strings correctly", () => {
    expect(sliceUtf16Safe("hello", 1, 4)).toBe("ell");
    expect(sliceUtf16Safe("hello", 0, 5)).toBe("hello");
    expect(sliceUtf16Safe("hello", 2)).toBe("llo");
  });

  it("handles negative indices", () => {
    expect(sliceUtf16Safe("hello", -2)).toBe("lo");
    expect(sliceUtf16Safe("hello", -4, -1)).toBe("ell");
  });

  it("swaps start and end indices if start > end", () => {
    expect(sliceUtf16Safe("hello", 4, 1)).toBe("ell");
  });

  it("preserves surrogate pairs (emojis)", () => {
    const input = "hi😀there"; // "hi" + \uD83D\uDE00 + "there"
    // "hi" is length 2. 😀 is at index 2 (high) and 3 (low). "there" starts at 4.

    // Slice including the emoji
    expect(sliceUtf16Safe(input, 0, 4)).toBe("hi😀");

    // Slice starting after emoji
    expect(sliceUtf16Safe(input, 4)).toBe("there");
  });

  it("adjusts indices to avoid splitting surrogate pairs", () => {
    const input = "hi😀";
    // h:0, i:1, high:2, low:3

    // Start index in middle of pair (at low surrogate) -> should increment start
    // slice(3) starts at low surrogate. from becomes 4. result ""
    expect(sliceUtf16Safe(input, 3)).toBe("");

    // End index in middle of pair (at low surrogate) -> should decrement end
    // slice(0, 3). to is 3 (low surrogate). to becomes 2. result "hi"
    expect(sliceUtf16Safe(input, 0, 3)).toBe("hi");
  });
});

describe("truncateUtf16Safe", () => {
  it("truncates standard strings", () => {
    expect(truncateUtf16Safe("hello", 3)).toBe("hel");
    expect(truncateUtf16Safe("hello", 10)).toBe("hello");
  });

  it("truncates at surrogate pair boundary safely", () => {
    const input = "hi😀";
    // length is 4.
    // truncate to 3. slice(0, 3) -> "hi" (from previous test)
    expect(truncateUtf16Safe(input, 3)).toBe("hi");

    // truncate to 2. slice(0, 2) -> "hi"
    expect(truncateUtf16Safe(input, 2)).toBe("hi");

    // truncate to 4. slice(0, 4) -> "hi😀"
    expect(truncateUtf16Safe(input, 4)).toBe("hi😀");
  });
});

describe("isSelfChatMode", () => {
  it("returns false if selfE164 is missing", () => {
    expect(isSelfChatMode(undefined, ["+123"])).toBe(false);
    expect(isSelfChatMode(null, ["+123"])).toBe(false);
    expect(isSelfChatMode("", ["+123"])).toBe(false);
  });

  it("returns false if allowFrom is invalid", () => {
    expect(isSelfChatMode("+123", undefined)).toBe(false);
    expect(isSelfChatMode("+123", null)).toBe(false);
    expect(isSelfChatMode("+123", [])).toBe(false);
    expect(isSelfChatMode("+123", {} as any)).toBe(false);
  });

  it("returns true for exact match", () => {
    expect(isSelfChatMode("+1234567890", ["+1234567890"])).toBe(true);
  });

  it("returns true for normalized match", () => {
    // missing +
    expect(isSelfChatMode("1234567890", ["+1234567890"])).toBe(true);
    // extra spaces/formatting
    expect(isSelfChatMode("+1 (234) 567-890", ["+1234567890"])).toBe(true);
    // allowFrom has formatting
    expect(isSelfChatMode("+1234567890", ["+1 (234) 567-890"])).toBe(true);
  });

  it("returns true for whatsapp prefix match", () => {
    expect(isSelfChatMode("whatsapp:+1234567890", ["+1234567890"])).toBe(true);
    expect(isSelfChatMode("+1234567890", ["whatsapp:+1234567890"])).toBe(true);
  });

  it("ignores wildcard in allowFrom", () => {
    expect(isSelfChatMode("+123", ["*"])).toBe(false);
    expect(isSelfChatMode("+123", ["*", "+123"])).toBe(true);
  });

  it("returns false for no match", () => {
    expect(isSelfChatMode("+123", ["+456", "+789"])).toBe(false);
  });
});
