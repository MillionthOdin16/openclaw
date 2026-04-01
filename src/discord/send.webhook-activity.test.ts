import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendWebhookMessageDiscord } from "./send.js";

const recordChannelActivityMock = vi.hoisted(() => vi.fn());
const loadConfigMock = vi.hoisted(() => vi.fn(() => ({ channels: { discord: {} } })));

vi.mock("../config/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config/config.js")>();
  return {
    ...actual,
    loadConfig: () => loadConfigMock(),
  };
});

vi.mock("../infra/channel-activity.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../infra/channel-activity.js")>();
  return {
    ...actual,
    recordChannelActivity: (...args: unknown[]) => recordChannelActivityMock(...args),
  };
});

describe("sendWebhookMessageDiscord activity", () => {
  beforeEach(() => {
    recordChannelActivityMock.mockClear();
    loadConfigMock.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ id: "msg-1", channel_id: "thread-1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records outbound channel activity for webhook sends", async () => {
    const cfg = {
      channels: {
        discord: {
          token: "resolved-token",
        },
      },
    };
    const result = await sendWebhookMessageDiscord("hello world", {
      cfg,
      webhookId: "wh-1",
      webhookToken: "tok-1",
      accountId: "runtime",
      threadId: "thread-1",
    });

    expect(result).toEqual({
      messageId: "msg-1",
      channelId: "thread-1",
    });
    expect(recordChannelActivityMock).toHaveBeenCalledWith({
      channel: "discord",
      accountId: "runtime",
      direction: "outbound",
    });
    expect(loadConfigMock).not.toHaveBeenCalled();
  });

  it("handles webhook response safely without json throwing on 503", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return {
          ok: false,
          status: 503,
          text: async () => "Service Unavailable",
          json: async () => { throw new Error("Unexpected token S in JSON"); },
        };
      })
    );

    await expect(
      sendWebhookMessageDiscord("hello", { webhookId: "123", webhookToken: "abc" })
    ).rejects.toThrow("Discord webhook send failed (503: Service Unavailable)");
  });
});
