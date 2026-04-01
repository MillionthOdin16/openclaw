import { fetch as undiciFetch } from "undici";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDiscordGatewayPlugin } from "./gateway-plugin.js";

vi.mock("undici", async (importOriginal) => {
  const mod = await importOriginal<typeof import("undici")>();
  return {
    ...mod,
    fetch: vi.fn(),
  };
});

describe("createDiscordGatewayPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles non-ok gateway bot response gracefully", async () => {
    const plugin = createDiscordGatewayPlugin({
      discordConfig: { proxy: "http://localhost:8080" },
      runtime: { log: vi.fn(), error: vi.fn() } as unknown as import("../../runtime.js").RuntimeEnv,
    });

    const mockResponse = {
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => {
        throw new Error("Unexpected token U in JSON");
      },
      text: async () => "Service Unavailable",
    };

    vi.mocked(undiciFetch).mockResolvedValueOnce(mockResponse as unknown as Response);

    await expect(
      plugin.registerClient({
        options: { token: "123" },
        registerListener: vi.fn(),
        registerPlugin: vi.fn(),
      } as unknown as Parameters<typeof plugin.registerClient>[0]),
    ).rejects.toThrow(
      "Failed to get gateway information from Discord: Gateway bot request failed (503: Service Unavailable)",
    );
  });

  it("handles empty text gracefully in non-ok response", async () => {
    const plugin = createDiscordGatewayPlugin({
      discordConfig: { proxy: "http://localhost:8080" },
      runtime: { log: vi.fn(), error: vi.fn() } as unknown as import("../../runtime.js").RuntimeEnv,
    });

    const mockResponse = {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => {
        throw new Error("Unexpected token U in JSON");
      },
      text: async () => {
        throw new Error("Cannot read text");
      },
    };

    vi.mocked(undiciFetch).mockResolvedValueOnce(mockResponse as unknown as Response);

    await expect(
      plugin.registerClient({
        options: { token: "123" },
        registerListener: vi.fn(),
        registerPlugin: vi.fn(),
      } as unknown as Parameters<typeof plugin.registerClient>[0]),
    ).rejects.toThrow(
      "Failed to get gateway information from Discord: Gateway bot request failed (401)",
    );
  });
});
