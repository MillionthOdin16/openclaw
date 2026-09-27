import { describe, expect, test } from "vitest";
import {
  stripInlineDirectiveTagsForDisplay,
  stripInlineDirectiveTagsFromMessageForDisplay,
  parseInlineDirectives,
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

  test("handles empty string", () => {
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

  test("returns undefined when message is undefined", () => {
    expect(stripInlineDirectiveTagsFromMessageForDisplay(undefined)).toBeUndefined();
  });

  test("ignores falsy or non-object content parts", () => {
    const input = {
      content: [null, "string", undefined],
    };
    const result = stripInlineDirectiveTagsFromMessageForDisplay(input);
    expect(result?.content).toEqual([null, "string", undefined]);
  });

  test("ignores non-text content parts", () => {
    const input = {
      content: [{ type: "image", url: "http://example.com/image.png" }],
    };
    const result = stripInlineDirectiveTagsFromMessageForDisplay(input);
    expect(result?.content).toEqual([{ type: "image", url: "http://example.com/image.png" }]);
  });
});

describe("parseInlineDirectives", () => {
  test("returns defaults for undefined text", () => {
    const result = parseInlineDirectives(undefined);
    expect(result).toEqual({
      text: "",
      audioAsVoice: false,
      replyToCurrent: false,
      hasAudioTag: false,
      hasReplyTag: false,
    });
  });

  test("returns defaults for text without tags", () => {
    const result = parseInlineDirectives("hello world");
    expect(result).toEqual({
      text: "hello world",
      audioAsVoice: false,
      replyToCurrent: false,
      hasAudioTag: false,
      hasReplyTag: false,
    });
  });

  test("parses audio tag and strips by default", () => {
    const result = parseInlineDirectives("hello [[audio_as_voice]]");
    expect(result.audioAsVoice).toBe(true);
    expect(result.hasAudioTag).toBe(true);
    expect(result.text).toBe("hello");
  });

  test("parses audio tag and keeps it if stripAudioTag is false", () => {
    const result = parseInlineDirectives("hello [[audio_as_voice]]", { stripAudioTag: false });
    expect(result.audioAsVoice).toBe(true);
    expect(result.hasAudioTag).toBe(true);
    expect(result.text).toBe("hello [[audio_as_voice]]");
  });

  test("parses reply_to_current and strips by default", () => {
    const result = parseInlineDirectives("hello [[reply_to_current]]");
    expect(result.replyToCurrent).toBe(true);
    expect(result.hasReplyTag).toBe(true);
    expect(result.text).toBe("hello");
  });

  test("parses reply_to_current and keeps it if stripReplyTags is false", () => {
    const result = parseInlineDirectives("hello [[reply_to_current]]", { stripReplyTags: false });
    expect(result.replyToCurrent).toBe(true);
    expect(result.hasReplyTag).toBe(true);
    expect(result.text).toBe("hello [[reply_to_current]]");
  });

  test("parses reply_to: id and strips by default", () => {
    const result = parseInlineDirectives("hello [[reply_to: abc-123 ]]");
    expect(result.replyToExplicitId).toBe("abc-123");
    expect(result.replyToId).toBe("abc-123");
    expect(result.hasReplyTag).toBe(true);
    expect(result.text).toBe("hello");
  });

  test("assigns currentMessageId if reply_to_current is used", () => {
    const result = parseInlineDirectives("hello [[reply_to_current]]", { currentMessageId: "msg-456" });
    expect(result.replyToId).toBe("msg-456");
  });

  test("parses reply_to: id with empty id (edge case)", () => {
    const result = parseInlineDirectives("hello [[reply_to:  ]]");
    expect(result.replyToExplicitId).toBeUndefined();
    expect(result.replyToId).toBeUndefined();
    expect(result.hasReplyTag).toBe(true);
    expect(result.text).toBe("hello");
  });
});
