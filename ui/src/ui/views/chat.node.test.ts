import { describe, expect, test } from "vitest";
import { memoizedBuildChatItems, type ChatProps, type ChatItemsCache } from "./chat.ts";

describe("memoizedBuildChatItems", () => {
  const baseProps: ChatProps = {
    sessionKey: "session-1",
    onSessionKeyChange: () => {},
    thinkingLevel: null,
    showThinking: false,
    loading: false,
    sending: false,
    messages: [],
    toolMessages: [],
    stream: null,
    streamStartedAt: null,
    draft: "",
    queue: [],
    connected: true,
    canSend: true,
    disabledReason: null,
    error: null,
    sessions: null,
    focusMode: false,
    assistantName: "Assistant",
    assistantAvatar: null,
    onRefresh: () => {},
    onToggleFocusMode: () => {},
    onDraftChange: () => {},
    onSend: () => {},
    onQueueRemove: () => {},
    onNewSession: () => {},
  };

  test("returns same result for same props using cache", () => {
    const itemsCache: ChatItemsCache = { lastArgs: null, lastResult: null };
    const messages = [{ role: "user", content: "hello", timestamp: 123 }];
    const props1: ChatProps = { ...baseProps, messages, itemsCache };
    const result1 = memoizedBuildChatItems(props1);

    const props2: ChatProps = { ...baseProps, messages, itemsCache, draft: "typing..." };
    const result2 = memoizedBuildChatItems(props2);

    expect(result1).toBe(result2);
  });

  test("returns new result when cache is missing", () => {
    const messages = [{ role: "user", content: "hello", timestamp: 123 }];
    const props1: ChatProps = { ...baseProps, messages }; // No cache
    const result1 = memoizedBuildChatItems(props1);

    const props2: ChatProps = { ...baseProps, messages, draft: "typing..." };
    const result2 = memoizedBuildChatItems(props2);

    expect(result1).not.toBe(result2);
  });

  test("returns new result when messages reference changes", () => {
    const itemsCache: ChatItemsCache = { lastArgs: null, lastResult: null };
    const messages1 = [{ role: "user", content: "hello", timestamp: 123 }];
    const props1: ChatProps = { ...baseProps, messages: messages1, itemsCache };
    const result1 = memoizedBuildChatItems(props1);

    const messages2 = [...messages1, { role: "assistant", content: "hi", timestamp: 124 }];
    const props2: ChatProps = { ...baseProps, messages: messages2, itemsCache };
    const result2 = memoizedBuildChatItems(props2);

    expect(result1).not.toBe(result2);
  });

  test("returns new result when showThinking changes", () => {
    const itemsCache: ChatItemsCache = { lastArgs: null, lastResult: null };
    const messages = [{ role: "user", content: "hello", timestamp: 123 }];
    const props1: ChatProps = { ...baseProps, messages, itemsCache, showThinking: false };
    const result1 = memoizedBuildChatItems(props1);

    const props2: ChatProps = { ...baseProps, messages, itemsCache, showThinking: true };
    const result2 = memoizedBuildChatItems(props2);

    expect(result1).not.toBe(result2);
  });

  test("returns new result when sessionKey changes", () => {
    const itemsCache: ChatItemsCache = { lastArgs: null, lastResult: null };
    const messages = [{ role: "user", content: "hello", timestamp: 123 }];
    const props1: ChatProps = { ...baseProps, messages, itemsCache, sessionKey: "key1" };
    const result1 = memoizedBuildChatItems(props1);

    const props2: ChatProps = { ...baseProps, messages, itemsCache, sessionKey: "key2" };
    const result2 = memoizedBuildChatItems(props2);

    expect(result1).not.toBe(result2);
  });
});
