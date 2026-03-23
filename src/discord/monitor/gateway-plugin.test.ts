import { GatewayIntents, GatewayPlugin } from "@buape/carbon/gateway";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createDiscordGatewayPlugin, resolveDiscordGatewayIntents } from "./gateway-plugin.js";

const { undiciFetchMock, proxyAgentSpy, httpsProxyAgentSpy } = vi.hoisted(() => ({
  undiciFetchMock: vi.fn(),
  proxyAgentSpy: vi.fn(),
  httpsProxyAgentSpy: vi.fn(),
}));

vi.mock("undici", async (importOriginal) => {
  const actual = await importOriginal<typeof import("undici")>();
  class ProxyAgent {
    proxyUrl: string;
    constructor(proxyUrl: string) {
      this.proxyUrl = proxyUrl;
      proxyAgentSpy(proxyUrl);
    }
  }
  return {
    ...actual,
    ProxyAgent,
    fetch: undiciFetchMock,
  };
});

vi.mock("https-proxy-agent", () => {
  class HttpsProxyAgent {
    proxyUrl: string;
    // adding a mocked method to bypass validation
    addRequest() {}
    constructor(proxyUrl: string) {
      if (proxyUrl === "bad-proxy") {
        throw new Error("bad proxy");
      }
      this.proxyUrl = proxyUrl;
      httpsProxyAgentSpy(proxyUrl);
    }
  }
  return {
    HttpsProxyAgent,
  };
});

// We need to stop it from actually making WS connections
vi.mock("@buape/carbon/gateway", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@buape/carbon/gateway")>();
  const MockGatewayPlugin = class GatewayPlugin extends actual.GatewayPlugin {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override async registerClient(_client: Parameters<actual.GatewayPlugin["registerClient"]>[0]) {
      // do nothing
      return {} as unknown;
    }
  };
  Object.defineProperty(MockGatewayPlugin, "name", { value: "GatewayPlugin" });
  return {
    ...actual,
    GatewayPlugin: MockGatewayPlugin,
  };
});

describe("resolveDiscordGatewayIntents", () => {
  it("resolves default intents", () => {
    const intents = resolveDiscordGatewayIntents();
    expect(intents).toBe(
      GatewayIntents.Guilds |
        GatewayIntents.GuildMessages |
        GatewayIntents.MessageContent |
        GatewayIntents.DirectMessages |
        GatewayIntents.GuildMessageReactions |
        GatewayIntents.DirectMessageReactions |
        GatewayIntents.GuildVoiceStates,
    );
  });

  it("adds presence intent when configured", () => {
    const intents = resolveDiscordGatewayIntents({ presence: true });
    expect(intents & GatewayIntents.GuildPresences).toBe(GatewayIntents.GuildPresences);
  });

  it("adds guildMembers intent when configured", () => {
    const intents = resolveDiscordGatewayIntents({ guildMembers: true });
    expect(intents & GatewayIntents.GuildMembers).toBe(GatewayIntents.GuildMembers);
  });
});

describe("createDiscordGatewayPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns standard GatewayPlugin when proxy is not configured", () => {
    const runtime = { log: vi.fn(), error: vi.fn(), exit: vi.fn() } as const;
    const plugin = createDiscordGatewayPlugin({
      discordConfig: { token: "test", intents: {} },
      runtime,
    });
    expect(plugin).toBeInstanceOf(GatewayPlugin);
    expect(plugin.constructor.name).toBe("GatewayPlugin");
  });

  it("returns proxy plugin when proxy is configured", async () => {
    const runtime = { log: vi.fn(), error: vi.fn(), exit: vi.fn() } as const;
    const plugin = createDiscordGatewayPlugin({
      discordConfig: { token: "test", proxy: "http://proxy.test:8080", intents: {} },
      runtime,
    });

    expect(plugin).toBeInstanceOf(GatewayPlugin);
    expect(plugin.constructor.name).toBe("ProxyGatewayPlugin");
    expect(runtime.log).toHaveBeenCalledWith("discord: gateway proxy enabled");
    expect(httpsProxyAgentSpy).toHaveBeenCalledWith("http://proxy.test:8080");
    expect(proxyAgentSpy).toHaveBeenCalledWith("http://proxy.test:8080");

    undiciFetchMock.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ url: "wss://gateway.discord.gg" }),
    });

    const client = { options: { token: "bot-token" }, registerListener: vi.fn() };
    await plugin.registerClient(
      client as unknown as Parameters<GatewayPlugin["registerClient"]>[0],
    );

    expect(undiciFetchMock).toHaveBeenCalledWith(
      "https://discord.com/api/v10/gateway/bot",
      expect.objectContaining({
        headers: { Authorization: "Bot bot-token" },
        dispatcher: expect.objectContaining({ proxyUrl: "http://proxy.test:8080" }),
      }),
    );
    expect((plugin as unknown as Record<string, unknown>).gatewayInfo).toEqual({
      url: "wss://gateway.discord.gg",
    });
  });

  it("throws clear error when fetching gateway info fails", async () => {
    const runtime = { log: vi.fn(), error: vi.fn(), exit: vi.fn() } as const;
    const plugin = createDiscordGatewayPlugin({
      discordConfig: { token: "test", proxy: "http://proxy.test:8080", intents: {} },
      runtime,
    });

    undiciFetchMock.mockRejectedValueOnce(new Error("network error"));
    const client = { options: { token: "bot-token" }, registerListener: vi.fn() };

    await expect(
      plugin.registerClient(client as unknown as Parameters<GatewayPlugin["registerClient"]>[0]),
    ).rejects.toThrow("Failed to get gateway information from Discord: network error");
  });

  it("falls back to standard plugin if proxy agent creation fails", () => {
    const runtime = { log: vi.fn(), error: vi.fn(), exit: vi.fn() } as const;
    const plugin = createDiscordGatewayPlugin({
      discordConfig: { token: "test", proxy: "bad-proxy", intents: {} },
      runtime,
    });

    expect(plugin).toBeInstanceOf(GatewayPlugin);
    expect(plugin.constructor.name).toBe("GatewayPlugin");
    expect(runtime.error).toHaveBeenCalled();
    const errorMessage = (runtime.error as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(errorMessage).toContain("discord: invalid gateway proxy");
    expect(errorMessage).toContain("bad proxy");
  });
});
