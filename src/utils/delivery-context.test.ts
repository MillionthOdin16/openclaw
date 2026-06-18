import { describe, expect, test } from "vitest";
import {
  normalizeDeliveryContext,
  normalizeSessionDeliveryFields,
  deliveryContextFromSession,
  mergeDeliveryContext,
  deliveryContextKey,
} from "./delivery-context.js";

describe("normalizeDeliveryContext", () => {
  test("returns undefined for empty input", () => {
    expect(normalizeDeliveryContext()).toBeUndefined();
    expect(normalizeDeliveryContext({})).toBeUndefined();
  });

  test("normalizes fields and trims whitespace", () => {
    expect(
      normalizeDeliveryContext({
        channel: " web ",
        to: " user ",
        accountId: " acc ",
        threadId: " thread ",
      }),
    ).toEqual({
      channel: "web",
      to: "user",
      accountId: "acc",
      threadId: "thread",
    });
  });

  test("truncates numeric threadId", () => {
    expect(normalizeDeliveryContext({ threadId: 123.45 })).toMatchObject({
      threadId: 123,
    });
  });
});

describe("mergeDeliveryContext", () => {
  test("merges non-conflicting fields", () => {
    const primary = { channel: "web", to: "user" };
    const fallback = { channel: "web", accountId: "acc" };
    expect(mergeDeliveryContext(primary, fallback)).toEqual({
      channel: "web",
      to: "user",
      accountId: "acc",
    });
  });

  test("ignores fallback route fields on channel conflict", () => {
    const primary = { channel: "web", to: "user" };
    const fallback = { channel: "sms", to: "phone", accountId: "acc" };
    expect(mergeDeliveryContext(primary, fallback)).toEqual({
      channel: "web",
      to: "user",
      // accountId and threadId from fallback are dropped because channel differs
    });
  });

  test("favors primary values", () => {
    const primary = { channel: "web", to: "user1" };
    const fallback = { channel: "web", to: "user2" };
    expect(mergeDeliveryContext(primary, fallback)).toEqual({
      channel: "web",
      to: "user1",
    });
  });
});

describe("deliveryContextKey", () => {
  test("returns undefined if context is undefined", () => {
    expect(deliveryContextKey()).toBeUndefined();
  });

  test("returns undefined if context has no channel", () => {
    expect(deliveryContextKey({ to: "user1" })).toBeUndefined();
  });

  test("returns undefined if context has no to", () => {
    expect(deliveryContextKey({ channel: "web" })).toBeUndefined();
  });

  test("returns formatted key with channel and to", () => {
    expect(deliveryContextKey({ channel: "web", to: "user1" })).toBe("web|user1||");
  });

  test("includes accountId if present", () => {
    expect(deliveryContextKey({ channel: "web", to: "user1", accountId: "acc123" })).toBe(
      "web|user1|acc123|",
    );
  });

  test("includes threadId if present", () => {
    expect(deliveryContextKey({ channel: "web", to: "user1", threadId: "thread123" })).toBe(
      "web|user1||thread123",
    );
    expect(deliveryContextKey({ channel: "web", to: "user1", threadId: 12345 })).toBe(
      "web|user1||12345",
    );
  });

  test("includes all fields correctly", () => {
    expect(
      deliveryContextKey({
        channel: "web",
        to: "user1",
        accountId: "acc123",
        threadId: "thread123",
      }),
    ).toBe("web|user1|acc123|thread123");
  });

  test("normalizes context before generating key", () => {
    expect(
      deliveryContextKey({
        channel: " web ",
        to: " user1 ",
        accountId: " acc123 ",
        threadId: " thread123 ",
      }),
    ).toBe("web|user1|acc123|thread123");
  });
});

describe("normalizeSessionDeliveryFields", () => {
  test("returns empty fields for undefined source", () => {
    expect(normalizeSessionDeliveryFields()).toEqual({
      deliveryContext: undefined,
      lastChannel: undefined,
      lastTo: undefined,
      lastAccountId: undefined,
      lastThreadId: undefined,
    });
  });

  test("extracts last* fields into context", () => {
    const source = {
      lastChannel: "web",
      lastTo: "user",
      lastAccountId: "acc",
      lastThreadId: "thread",
    };
    expect(normalizeSessionDeliveryFields(source)).toEqual({
      deliveryContext: {
        channel: "web",
        to: "user",
        accountId: "acc",
        threadId: "thread",
      },
      lastChannel: "web",
      lastTo: "user",
      lastAccountId: "acc",
      lastThreadId: "thread",
    });
  });

  test("returns empty if merged context is undefined", () => {
    expect(normalizeSessionDeliveryFields({})).toEqual({
      deliveryContext: undefined,
      lastChannel: undefined,
      lastTo: undefined,
      lastAccountId: undefined,
      lastThreadId: undefined,
    });
  });

  test("uses top-level channel if lastChannel is missing", () => {
    expect(normalizeSessionDeliveryFields({ channel: "web", lastTo: "user" })).toMatchObject({
      deliveryContext: expect.objectContaining({ channel: "web" }),
    });
  });
});

describe("deliveryContextFromSession", () => {
  test("returns undefined for undefined entry", () => {
    expect(deliveryContextFromSession()).toBeUndefined();
  });

  test("extracts delivery context using entry values", () => {
    expect(
      deliveryContextFromSession({
        lastChannel: "sms",
        lastTo: "1234",
      }),
    ).toEqual({
      channel: "sms",
      to: "1234",
    });
  });

  test("falls back threadId to origin.threadId", () => {
    expect(
      deliveryContextFromSession({
        lastChannel: "web",
        lastTo: "user",
        origin: { threadId: "thread123" },
      }),
    ).toEqual({
      channel: "web",
      to: "user",
      threadId: "thread123",
    });
  });

  test("falls back threadId to deliveryContext.threadId", () => {
    expect(
      deliveryContextFromSession({
        lastChannel: "web",
        lastTo: "user",
        deliveryContext: { threadId: "thread123" },
      }),
    ).toEqual({
      channel: "web",
      to: "user",
      threadId: "thread123",
    });
  });
});
