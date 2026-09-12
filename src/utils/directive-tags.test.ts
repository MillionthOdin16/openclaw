import { describe, expect, test } from "vitest";
import {
  parseInlineDirectives,
  stripInlineDirectiveTagsForDisplay,
  stripInlineDirectiveTagsFromMessageForDisplay,
} from "./directive-tags.js";

describe("stripInlineDirectiveTagsForDisplay", () => {
  test("removes reply and audio directives", () => {
    const input = "hello [[reply_to_current]] world [[reply_to:abc-123]] [[audio_as_voice]]";
    const result = stripInlineDirectiveTagsForDisplay(input);
    expect(result.changed).toBe(true);
    expect(result.text).toBe("hello  world  ");
  });

  test("supports whitespace variants", () => {
    const input = "[[ reply_to : 123 ]]ok[[ audio_as_voice ]]";
    const result = stripInlineDirectiveTagsForDisplay(input);
    expect(result.changed).toBe(true);
    expect(result.text).toBe("ok");
  });

  test("does not mutate plain text", () => {
    const input = "  keep leading and trailing whitespace  ";
    const result = stripInlineDirectiveTagsForDisplay(input);
    expect(result.changed).toBe(false);
    expect(result.text).toBe(input);
  });

  test("returns empty string and changed false when input is empty string", () => {
    const result = stripInlineDirectiveTagsForDisplay("");
    expect(result.changed).toBe(false);
    expect(result.text).toBe("");
  });
});

describe("stripInlineDirectiveTagsFromMessageForDisplay", () => {
  test("strips inline directives from text content blocks", () => {
    const input = {
      role: "assistant",
      content: [{ type: "text", text: "hello [[reply_to_current]] world [[audio_as_voice]]" }],
    };
    const result = stripInlineDirectiveTagsFromMessageForDisplay(input);
    expect(result).toBeDefined();
    expect(result?.content).toEqual([{ type: "text", text: "hello  world " }]);
  });

  test("preserves empty-string text when directives are entire content", () => {
    const input = {
      role: "assistant",
      content: [{ type: "text", text: "[[reply_to_current]]" }],
    };
    const result = stripInlineDirectiveTagsFromMessageForDisplay(input);
    expect(result).toBeDefined();
    expect(result?.content).toEqual([{ type: "text", text: "" }]);
  });

  test("returns original message when content is not an array", () => {
    const input = {
      role: "assistant",
      content: "plain text",
    };
    const result = stripInlineDirectiveTagsFromMessageForDisplay(input);
    expect(result).toEqual(input);
  });

  test("returns undefined if message is undefined", () => {
    const result = stripInlineDirectiveTagsFromMessageForDisplay(undefined);
    expect(result).toBeUndefined();
  });

  test("preserves non-text content blocks", () => {
    const input = {
      role: "assistant",
      content: [
        { type: "text", text: "hello [[reply_to_current]]" },
        { type: "image", url: "https://example.com/image.png" },
        null,
        "not an object"
      ],
    };
    const result = stripInlineDirectiveTagsFromMessageForDisplay(input as any);
    expect(result?.content).toEqual([
      { type: "text", text: "hello " },
      { type: "image", url: "https://example.com/image.png" },
      null,
      "not an object"
    ]);
  });
});

describe("parseInlineDirectives", () => {
  test("handles undefined text", () => {
    const result = parseInlineDirectives();
    expect(result).toEqual({
      text: "",
      audioAsVoice: false,
      replyToCurrent: false,
      hasAudioTag: false,
      hasReplyTag: false,
    });
  });

  test("handles text with no directives", () => {
    const input = "plain text  with   spaces\n\nmore text";
    const result = parseInlineDirectives(input);
    expect(result.text).toBe("plain text with spaces\n\nmore text");
    expect(result.audioAsVoice).toBe(false);
    expect(result.replyToCurrent).toBe(false);
    expect(result.hasAudioTag).toBe(false);
    expect(result.hasReplyTag).toBe(false);
  });

  test("parses audio_as_voice directive", () => {
    const input = "hello [[audio_as_voice]] world";
    const result = parseInlineDirectives(input);
    expect(result.audioAsVoice).toBe(true);
    expect(result.hasAudioTag).toBe(true);
    expect(result.text).toBe("hello world");
  });

  test("parses reply_to_current directive", () => {
    const input = "hello [[reply_to_current]] world";
    const result = parseInlineDirectives(input, { currentMessageId: "msg-123" });
    expect(result.replyToCurrent).toBe(true);
    expect(result.hasReplyTag).toBe(true);
    expect(result.replyToId).toBe("msg-123");
    expect(result.text).toBe("hello world");
  });

  test("parses reply_to explicit ID directive", () => {
    const input = "hello [[reply_to: abc-456 ]] world";
    const result = parseInlineDirectives(input);
    expect(result.hasReplyTag).toBe(true);
    expect(result.replyToExplicitId).toBe("abc-456");
    expect(result.replyToId).toBe("abc-456");
    expect(result.text).toBe("hello world");
  });

  test("parses reply_to explicit ID empty string - not matching regex", () => {
    // The regex /\[\[\s*(?:reply_to_current|reply_to\s*:\s*([^\]\n]+))\s*\]\]/gi
    // Requires at least one character after the colon because of [^\]\n]+
    const input = "hello [[reply_to:]] world";
    const result = parseInlineDirectives(input);
    expect(result.hasReplyTag).toBe(false);
    expect(result.replyToExplicitId).toBeUndefined();
    expect(result.replyToId).toBeUndefined();
    expect(result.text).toBe("hello [[reply_to:]] world");
  });

  test("explicit ID overrides reply_to_current", () => {
    const input = "[[reply_to_current]] [[reply_to: explicit-1]]";
    const result = parseInlineDirectives(input, { currentMessageId: "msg-123" });
    expect(result.replyToCurrent).toBe(true);
    expect(result.replyToExplicitId).toBe("explicit-1");
    expect(result.replyToId).toBe("explicit-1");
    expect(result.text).toBe("");
  });

  test("explicit ID with empty string after trim", () => {
    // Simulate a match where the captured group is just whitespace, which trim() turns to ""
    const input = "hello [[reply_to:   ]] world";
    const result = parseInlineDirectives(input, { currentMessageId: "msg-123" });
    expect(result.hasReplyTag).toBe(true);
    // When id.trim() is empty, lastExplicitId shouldn't be set
    expect(result.replyToExplicitId).toBeUndefined();
    expect(result.text).toBe("hello world");
  });

  test("preserves directives if strip options are false", () => {
    const input = "hello [[audio_as_voice]] [[reply_to_current]]";
    const result = parseInlineDirectives(input, { stripAudioTag: false, stripReplyTags: false });
    expect(result.audioAsVoice).toBe(true);
    expect(result.replyToCurrent).toBe(true);
    // Note: normalizeDirectiveWhitespace collapses spaces, so we verify directives remain
    expect(result.text).toContain("[[audio_as_voice]]");
    expect(result.text).toContain("[[reply_to_current]]");
  });
});
