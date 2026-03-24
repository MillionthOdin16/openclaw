import { describe, expect, it, vi, beforeEach } from "vitest";
import { resolveDiscordRestFetch } from "./rest-fetch.js";

const mockUndiciFetch = vi.fn();
const mockProxyAgent = vi.fn();

vi.mock("undici", () => {
  return {
    fetch: (...args: unknown[]) => mockUndiciFetch(...args),
    ProxyAgent: class ProxyAgent {
      constructor(public url: string) {
        if (url === "invalid") {
          throw new Error("Invalid URL");
        }
        mockProxyAgent(url);
      }
    },
  };
});

describe("resolveDiscordRestFetch", () => {
  const runtime = {
    log: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns global fetch when proxyUrl is undefined", () => {
    const result = resolveDiscordRestFetch(undefined, runtime as unknown as import("../../runtime.js").RuntimeEnv);
    expect(result).toBe(global.fetch);
  });

  it("returns global fetch when proxyUrl is empty string", () => {
    const result = resolveDiscordRestFetch("   ", runtime as unknown as import("../../runtime.js").RuntimeEnv);
    expect(result).toBe(global.fetch);
  });

  it("returns a custom fetch proxy when proxyUrl is provided", async () => {
    const customFetch = resolveDiscordRestFetch("http://proxy:8080", runtime as unknown as import("../../runtime.js").RuntimeEnv);
    expect(customFetch).not.toBe(global.fetch);
    expect(runtime.log).toHaveBeenCalledWith("discord: rest proxy enabled");
    expect(mockProxyAgent).toHaveBeenCalledWith("http://proxy:8080");

    mockUndiciFetch.mockResolvedValueOnce(new Response("ok"));

    const response = await customFetch("https://discord.com/api", { method: "GET" });
    expect(response).toBeInstanceOf(Response);
    expect(mockUndiciFetch).toHaveBeenCalledTimes(1);
    expect(mockUndiciFetch).toHaveBeenCalledWith(
      "https://discord.com/api",
      expect.objectContaining({
        method: "GET",
        dispatcher: expect.any(Object),
      }),
    );
  });

  it("catches errors and returns global fetch when proxy config is invalid", () => {
    const customFetch = resolveDiscordRestFetch("invalid", runtime as unknown as import("../../runtime.js").RuntimeEnv);
    expect(customFetch).toBe(global.fetch);
    expect(runtime.error).toHaveBeenCalledTimes(1);
    expect(runtime.error.mock.calls[0]?.[0]).toMatch(/invalid rest proxy/);
  });
});
