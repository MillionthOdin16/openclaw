import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ChannelPlugin } from "../channels/plugins/types.js";
import { setActivePluginRegistry } from "../plugins/runtime.js";
import { createMSTeamsTestPluginBase, createTestRegistry } from "../test-utils/channel-plugins.js";
import {
  resolveGatewayMessageChannel,
  isGatewayCliClient,
  isInternalMessageChannel,
  isWebchatClient,
  normalizeMessageChannel,
  listDeliverableMessageChannels,
  listGatewayMessageChannels,
  listGatewayAgentChannelAliases,
  listGatewayAgentChannelValues,
  isGatewayMessageChannel,
  isDeliverableMessageChannel,
  resolveMessageChannel,
  isMarkdownCapableMessageChannel,
} from "./message-channel.js";

const emptyRegistry = createTestRegistry([]);
const msteamsPlugin: ChannelPlugin = {
  ...createMSTeamsTestPluginBase(),
};

describe("message-channel", () => {
  beforeEach(() => {
    setActivePluginRegistry(emptyRegistry);
  });

  afterEach(() => {
    setActivePluginRegistry(emptyRegistry);
  });

  it("normalizes gateway message channels and rejects unknown values", () => {
    expect(resolveGatewayMessageChannel("discord")).toBe("discord");
    expect(resolveGatewayMessageChannel(" imsg ")).toBe("imessage");
    expect(resolveGatewayMessageChannel("web")).toBeUndefined();
    expect(resolveGatewayMessageChannel("nope")).toBeUndefined();
  });

  it("normalizes plugin aliases when registered", () => {
    setActivePluginRegistry(
      createTestRegistry([{ pluginId: "msteams", plugin: msteamsPlugin, source: "test" }]),
    );
    expect(resolveGatewayMessageChannel("teams")).toBe("msteams");
  });
});

describe("isGatewayCliClient", () => {
  it("returns true for CLI mode", () => {
    expect(isGatewayCliClient({ mode: "cli" })).toBe(true);
  });

  it("returns false for non-CLI mode", () => {
    expect(isGatewayCliClient({ mode: "webchat" })).toBe(false);
    expect(isGatewayCliClient(null)).toBe(false);
    expect(isGatewayCliClient({ mode: null })).toBe(false);
  });
});

describe("isInternalMessageChannel", () => {
  it("returns true for internal message channel", () => {
    expect(isInternalMessageChannel("webchat")).toBe(true);
    expect(isInternalMessageChannel(" WEbchat  ")).toBe(true);
  });

  it("returns false for other channels", () => {
    expect(isInternalMessageChannel("slack")).toBe(false);
    expect(isInternalMessageChannel(null)).toBe(false);
  });
});

describe("isWebchatClient", () => {
  it("returns true for webchat mode", () => {
    expect(isWebchatClient({ mode: "webchat" })).toBe(true);
  });

  it("returns true for webchat client ID", () => {
    expect(isWebchatClient({ id: "webchat-ui" })).toBe(true);
  });

  it("returns false for other clients", () => {
    expect(isWebchatClient({ mode: "cli", id: "cli-agent" })).toBe(false);
    expect(isWebchatClient(null)).toBe(false);
  });
});

describe("normalizeMessageChannel", () => {
  it("returns undefined for empty input", () => {
    expect(normalizeMessageChannel()).toBeUndefined();
    expect(normalizeMessageChannel("")).toBeUndefined();
    expect(normalizeMessageChannel("   ")).toBeUndefined();
  });

  it("normalizes internal message channel", () => {
    expect(normalizeMessageChannel(" webchat ")).toBe("webchat");
  });

  it("normalizes built-in channels", () => {
    expect(normalizeMessageChannel(" Slack ")).toBe("slack");
    expect(normalizeMessageChannel(" imsg ")).toBe("imessage");
  });

  it("returns the raw normalized value if no match is found", () => {
    expect(normalizeMessageChannel(" unknown ")).toBe("unknown");
  });
});

describe("list functions", () => {
  it("listDeliverableMessageChannels", () => {
    const channels = listDeliverableMessageChannels();
    expect(channels).toContain("slack");
    expect(channels).toContain("discord");
  });

  it("listGatewayMessageChannels", () => {
    const channels = listGatewayMessageChannels();
    expect(channels).toContain("slack");
    expect(channels).toContain("webchat");
  });

  it("listGatewayAgentChannelAliases", () => {
    const aliases = listGatewayAgentChannelAliases();
    expect(aliases).toContain("imsg");
  });

  it("listGatewayAgentChannelValues", () => {
    const values = listGatewayAgentChannelValues();
    expect(values).toContain("slack");
    expect(values).toContain("webchat");
    expect(values).toContain("last");
    expect(values).toContain("imsg");
  });
});

describe("type guards", () => {
  it("isGatewayMessageChannel", () => {
    expect(isGatewayMessageChannel("slack")).toBe(true);
    expect(isGatewayMessageChannel("webchat")).toBe(true);
    expect(isGatewayMessageChannel("unknown")).toBe(false);
  });

  it("isDeliverableMessageChannel", () => {
    expect(isDeliverableMessageChannel("slack")).toBe(true);
    expect(isDeliverableMessageChannel("webchat")).toBe(false); // internal, not deliverable
    expect(isDeliverableMessageChannel("unknown")).toBe(false);
  });
});

describe("resolveMessageChannel", () => {
  it("resolves primary channel", () => {
    expect(resolveMessageChannel(" slack ", "discord")).toBe("slack");
  });

  it("resolves fallback channel", () => {
    expect(resolveMessageChannel(null, "discord")).toBe("discord");
    expect(resolveMessageChannel("   ", "discord")).toBe("discord");
  });

  it("returns undefined if both are invalid", () => {
    expect(resolveMessageChannel(null, undefined)).toBeUndefined();
  });
});

describe("isMarkdownCapableMessageChannel", () => {
  it("returns true for markdown capable channels", () => {
    expect(isMarkdownCapableMessageChannel("slack")).toBe(true);
    expect(isMarkdownCapableMessageChannel("discord")).toBe(true);
    expect(isMarkdownCapableMessageChannel("webchat")).toBe(true);
  });

  it("returns false for non-markdown capable channels", () => {
    expect(isMarkdownCapableMessageChannel("sms")).toBe(false);
    expect(isMarkdownCapableMessageChannel("unknown")).toBe(false);
    expect(isMarkdownCapableMessageChannel(null)).toBe(false);
  });
});
