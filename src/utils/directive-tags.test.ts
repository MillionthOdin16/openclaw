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
});

describe("parseInlineDirectives", () => {
  test("handles empty or missing text", () => {
    expect(parseInlineDirectives("")).toEqual({
      text: "",
      audioAsVoice: false,
      replyToCurrent: false,
      hasAudioTag: false,
      hasReplyTag: false,
    });
    expect(parseInlineDirectives(undefined)).toEqual({
      text: "",
      audioAsVoice: false,
      replyToCurrent: false,
      hasAudioTag: false,
      hasReplyTag: false,
    });
  });

  test("returns text normalized when no directives exist", () => {
    expect(parseInlineDirectives("  hello \t world \n ")).toEqual({
      text: "hello world",
      audioAsVoice: false,
      replyToCurrent: false,
      hasAudioTag: false,
      hasReplyTag: false,
    });
  });

  test("parses and strips audio_as_voice directive", () => {
    const result = parseInlineDirectives("say this [[audio_as_voice]]");
    expect(result).toMatchObject({
      text: "say this",
      audioAsVoice: true,
      hasAudioTag: true,
    });
  });

  test("parses and strips reply_to_current directive", () => {
    const result = parseInlineDirectives("[[reply_to_current]] answer", {
      currentMessageId: "msg-123",
    });
    expect(result).toMatchObject({
      text: "answer",
      replyToId: "msg-123",
      replyToCurrent: true,
      hasReplyTag: true,
    });
  });

  test("parses and strips reply_to explicit id directive", () => {
    const result = parseInlineDirectives("replying [[reply_to:msg-456]] here");
    expect(result).toMatchObject({
      text: "replying here",
      replyToId: "msg-456",
      replyToExplicitId: "msg-456",
      hasReplyTag: true,
    });
  });

  test("preserves tags if strip options are false", () => {
    const result = parseInlineDirectives("test [[audio_as_voice]] [[reply_to_current]]", {
      stripAudioTag: false,
      stripReplyTags: false,
      currentMessageId: "msg-123",
    });
    expect(result).toMatchObject({
      text: "test [[audio_as_voice]] [[reply_to_current]]",
      audioAsVoice: true,
      replyToId: "msg-123",
      replyToCurrent: true,
      hasAudioTag: true,
      hasReplyTag: true,
    });
  });

  test("favors explicit id over currentMessageId if both are found", () => {
    const result = parseInlineDirectives("[[reply_to_current]] [[reply_to:msg-explicit]]", {
      currentMessageId: "msg-current",
    });
    expect(result).toMatchObject({
      replyToId: "msg-explicit",
      replyToExplicitId: "msg-explicit",
      replyToCurrent: true,
      hasReplyTag: true,
    });
  });
});
