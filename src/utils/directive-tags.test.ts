import { describe, expect, test } from "vitest";
import {
  parseInlineDirectives,
  stripInlineDirectiveTagsForDisplay,
  stripInlineDirectiveTagsFromMessageForDisplay,
} from "./directive-tags.js";

describe("stripInlineDirectiveTagsForDisplay", () => {
  test("returns empty text for falsy input", () => {
    const result = stripInlineDirectiveTagsForDisplay("");
    expect(result.changed).toBe(false);
    expect(result.text).toBe("");
  });

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
});

describe("stripInlineDirectiveTagsFromMessageForDisplay", () => {
  test("returns undefined when message is undefined", () => {
    expect(stripInlineDirectiveTagsFromMessageForDisplay(undefined)).toBeUndefined();
  });

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

  test("skips falsy parts in content array", () => {
    const input = {
      content: [null, undefined, { type: "text", text: "[[audio_as_voice]] hi" }],
    };
    const result = stripInlineDirectiveTagsFromMessageForDisplay(input);
    expect(result?.content).toEqual([null, undefined, { type: "text", text: " hi" }]);
  });

  test("skips non-object parts in content array", () => {
    const input = {
      content: ["string", 42, { type: "text", text: "hi [[audio_as_voice]]" }],
    };
    const result = stripInlineDirectiveTagsFromMessageForDisplay(input);
    expect(result?.content).toEqual(["string", 42, { type: "text", text: "hi " }]);
  });

  test("skips non-text parts in content array", () => {
    const input = {
      content: [{ type: "image", url: "https://example.com/img.png" }],
    };
    const result = stripInlineDirectiveTagsFromMessageForDisplay(input);
    expect(result?.content).toEqual([{ type: "image", url: "https://example.com/img.png" }]);
  });
});

describe("parseInlineDirectives", () => {
  test("handles falsy text", () => {
    const result = parseInlineDirectives(undefined);
    expect(result.text).toBe("");
    expect(result.audioAsVoice).toBe(false);
    expect(result.replyToCurrent).toBe(false);
    expect(result.hasAudioTag).toBe(false);
    expect(result.hasReplyTag).toBe(false);
  });

  test("handles text without tags", () => {
    const result = parseInlineDirectives("hello world");
    expect(result.text).toBe("hello world");
    expect(result.audioAsVoice).toBe(false);
    expect(result.replyToCurrent).toBe(false);
    expect(result.hasAudioTag).toBe(false);
    expect(result.hasReplyTag).toBe(false);
  });

  test("parses audio_as_voice tag", () => {
    const result = parseInlineDirectives("play this [[audio_as_voice]]");
    expect(result.text).toBe("play this");
    expect(result.audioAsVoice).toBe(true);
    expect(result.hasAudioTag).toBe(true);
    expect(result.hasReplyTag).toBe(false);
  });

  test("parses reply_to_current tag", () => {
    const result = parseInlineDirectives("reply [[reply_to_current]]", {
      currentMessageId: "msg-123",
    });
    expect(result.text).toBe("reply");
    expect(result.replyToCurrent).toBe(true);
    expect(result.replyToId).toBe("msg-123");
    expect(result.hasReplyTag).toBe(true);
  });

  test("parses reply_to tag with explicit id", () => {
    const result = parseInlineDirectives("reply [[reply_to:msg-456]]", {
      currentMessageId: "msg-123",
    });
    expect(result.text).toBe("reply");
    expect(result.replyToCurrent).toBe(false);
    expect(result.replyToId).toBe("msg-456");
    expect(result.replyToExplicitId).toBe("msg-456");
    expect(result.hasReplyTag).toBe(true);
  });

  test("respects strip options", () => {
    const result = parseInlineDirectives("hello [[audio_as_voice]] [[reply_to:123]]", {
      stripAudioTag: false,
      stripReplyTags: false,
    });
    expect(result.text).toBe("hello [[audio_as_voice]] [[reply_to:123]]");
    expect(result.audioAsVoice).toBe(true);
    expect(result.replyToId).toBe("123");
  });
});
