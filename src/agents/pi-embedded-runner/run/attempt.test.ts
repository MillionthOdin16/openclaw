import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { ImageContent } from "@mariozechner/pi-ai";
import { describe, expect, it } from "vitest";
import {
  injectHistoryImagesIntoMessages,
  wrapStreamFnWithSiblingToolCallErrorHandling,
} from "./attempt.js";

describe("wrapStreamFnWithSiblingToolCallErrorHandling", () => {
  it("catches sibling tool call error and rethrows as standard Error", async () => {
    const errorMsg = "some error containing sibling tool call errored";

    const throwingStreamFn = async function* () {
      throw errorMsg; // throwing a string or whatever
    };

    const wrappedFn = wrapStreamFnWithSiblingToolCallErrorHandling(throwingStreamFn);

    const consumeStream = async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of wrappedFn({}, {}, {})) {
        // do nothing
      }
    };

    // Expect it to reject with a standard Error object with specific message
    await expect(consumeStream()).rejects.toThrow(/Anthropic sibling tool call error \(handled\)/);
  });

  it("rethrows other errors untouched", async () => {
    const errorMsg = "random error";

    const throwingStreamFn = async function* () {
      throw new Error(errorMsg);
    };

    const wrappedFn = wrapStreamFnWithSiblingToolCallErrorHandling(throwingStreamFn);

    const consumeStream = async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of wrappedFn({}, {}, {})) {
        // do nothing
      }
    };

    await expect(consumeStream()).rejects.toThrow(errorMsg);
    // Should NOT match the handled error message
    await expect(consumeStream()).rejects.not.toThrow(
      /Anthropic sibling tool call error \(handled\)/,
    );
  });
});

describe("injectHistoryImagesIntoMessages", () => {
  const image: ImageContent = { type: "image", data: "abc", mimeType: "image/png" };

  it("injects history images and converts string content", () => {
    const messages: AgentMessage[] = [
      {
        role: "user",
        content: "See /tmp/photo.png",
      } as AgentMessage,
    ];

    const didMutate = injectHistoryImagesIntoMessages(messages, new Map([[0, [image]]]));

    expect(didMutate).toBe(true);
    expect(Array.isArray(messages[0]?.content)).toBe(true);
    const content = messages[0]?.content as Array<{ type: string; text?: string; data?: string }>;
    expect(content).toHaveLength(2);
    expect(content[0]?.type).toBe("text");
    expect(content[1]).toMatchObject({ type: "image", data: "abc" });
  });

  it("avoids duplicating existing image content", () => {
    const messages: AgentMessage[] = [
      {
        role: "user",
        content: [{ type: "text", text: "See /tmp/photo.png" }, { ...image }],
      } as AgentMessage,
    ];

    const didMutate = injectHistoryImagesIntoMessages(messages, new Map([[0, [image]]]));

    expect(didMutate).toBe(false);
    const first = messages[0];
    if (!first || !Array.isArray(first.content)) {
      throw new Error("expected array content");
    }
    expect(first.content).toHaveLength(2);
  });

  it("ignores non-user messages and out-of-range indices", () => {
    const messages: AgentMessage[] = [
      {
        role: "assistant",
        content: "noop",
      } as AgentMessage,
    ];

    const didMutate = injectHistoryImagesIntoMessages(messages, new Map([[1, [image]]]));

    expect(didMutate).toBe(false);
    expect(messages[0]?.content).toBe("noop");
  });
});
