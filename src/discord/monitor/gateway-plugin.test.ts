import { GatewayIntents, GatewayPlugin } from "@buape/carbon/gateway";
import { describe, expect, it, vi } from "vitest";
import { createDiscordGatewayPlugin, resolveDiscordGatewayIntents } from "./gateway-plugin.js";

const mockUndiciFetch = vi.fn();
vi.mock("undici", () => {
  return {
    fetch: (...args: unknown[]) => mockUndiciFetch(...args),
    ProxyAgent: class ProxyAgent {
      constructor(public url: string) {}
    },
  };
});

describe("resolveDiscordGatewayIntents", () => {
  it("returns default intents when config is undefined", () => {
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

  it("adds GuildPresences when presence config is true", () => {
    const intents = resolveDiscordGatewayIntents({ presence: true });
    expect(intents & GatewayIntents.GuildPresences).toBe(GatewayIntents.GuildPresences);
  });

  it("adds GuildMembers when guildMembers config is true", () => {
    const intents = resolveDiscordGatewayIntents({ guildMembers: true });
    expect(intents & GatewayIntents.GuildMembers).toBe(GatewayIntents.GuildMembers);
  });
});

describe("createDiscordGatewayPlugin", () => {
  const runtime = {
    log: vi.fn(),
    error: vi.fn(),
  };

  it("returns a standard GatewayPlugin when proxy is disabled", () => {
    const plugin = createDiscordGatewayPlugin({
      discordConfig: { token: "token", id: "id" },
      runtime: runtime as unknown as import("../../runtime.js").RuntimeEnv,
    });
    expect(plugin).toBeInstanceOf(GatewayPlugin);
    expect(plugin.constructor.name).toBe("GatewayPlugin");
  });

  it("returns a ProxyGatewayPlugin when proxy is enabled", () => {
    const plugin = createDiscordGatewayPlugin({
      discordConfig: { token: "token", id: "id", proxy: "http://proxy:8080" },
      runtime: runtime as unknown as import("../../runtime.js").RuntimeEnv,
    });
    expect(plugin).toBeInstanceOf(GatewayPlugin);
    expect(plugin.constructor.name).toBe("ProxyGatewayPlugin");
    expect(runtime.log).toHaveBeenCalledWith("discord: gateway proxy enabled");
  });

  it("gracefully falls back to GatewayPlugin and logs error on invalid proxy URL", () => {
    const plugin = createDiscordGatewayPlugin({
      discordConfig: { token: "token", id: "id", proxy: "invalid-url" },
      runtime: runtime as unknown as import("../../runtime.js").RuntimeEnv,
    });
    expect(plugin.constructor.name).toBe("GatewayPlugin");
    expect(runtime.error).toHaveBeenCalled();
  });
});

describe("ProxyGatewayPlugin registerClient", () => {
  const runtime = {
    log: vi.fn(),
    error: vi.fn(),
  };

  it("fetches gateway info via proxy and initializes", async () => {
    const plugin = createDiscordGatewayPlugin({
      discordConfig: { token: "token", id: "id", proxy: "http://proxy:8080" },
      runtime: runtime as unknown as import("../../runtime.js").RuntimeEnv,
    });

    mockUndiciFetch.mockResolvedValueOnce({
      json: async () => ({ url: "wss://gateway.discord.gg", shards: 1, session_start_limit: {} }),
    });

    const client = {
      options: { token: "test-token" },
    };

    // Replace GatewayPlugin's registerClient to avoid actual connect attempts
    const originalSuperRegisterClient = Object.getPrototypeOf(Object.getPrototypeOf(plugin)).registerClient;
    Object.getPrototypeOf(Object.getPrototypeOf(plugin)).registerClient = vi.fn().mockResolvedValue(undefined);

    try {
      await plugin.registerClient(client as unknown as Parameters<GatewayPlugin["registerClient"]>[0]);

      expect(mockUndiciFetch).toHaveBeenCalledTimes(1);
      expect(mockUndiciFetch).toHaveBeenCalledWith(
        "https://discord.com/api/v10/gateway/bot",
        expect.objectContaining({
          headers: { Authorization: "Bot test-token" },
        }),
      );

      // Property injected into gateway plugin
      expect((plugin as unknown as { gatewayInfo: unknown }).gatewayInfo).toEqual({
        url: "wss://gateway.discord.gg",
        shards: 1,
        session_start_limit: {},
      });
    } finally {
      // Restore the mock
      Object.getPrototypeOf(Object.getPrototypeOf(plugin)).registerClient = originalSuperRegisterClient;
    }
  });

  it("catches errors during undici fetch", async () => {
    const plugin = createDiscordGatewayPlugin({
      discordConfig: { token: "token", id: "id", proxy: "http://proxy:8080" },
      runtime: runtime as unknown as import("../../runtime.js").RuntimeEnv,
    });

    mockUndiciFetch.mockRejectedValueOnce(new Error("Network Error"));

    const client = {
      options: { token: "test-token" },
    };

    await expect(plugin.registerClient(client as unknown as Parameters<GatewayPlugin["registerClient"]>[0])).rejects.toThrow(
      "Failed to get gateway information from Discord: Network Error",
    );
  });

  it("catches errors during json parsing", async () => {
    const plugin = createDiscordGatewayPlugin({
      discordConfig: { token: "token", id: "id", proxy: "http://proxy:8080" },
      runtime: runtime as unknown as import("../../runtime.js").RuntimeEnv,
    });

    mockUndiciFetch.mockResolvedValueOnce({
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    const client = {
      options: { token: "test-token" },
    };

    await expect(plugin.registerClient(client as unknown as Parameters<GatewayPlugin["registerClient"]>[0])).rejects.toThrow(
      "Failed to get gateway information from Discord: Invalid JSON",
    );
  });
});
