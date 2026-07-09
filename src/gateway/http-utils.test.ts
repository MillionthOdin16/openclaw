import { describe, expect, it, vi } from "vitest";
import {
  getHeader,
  getBearerToken,
  resolveAgentIdFromHeader,
  resolveAgentIdFromModel,
  resolveAgentIdForRequest,
  resolveSessionKey,
  resolveGatewayRequestContext,
} from "./http-utils.js";
import type { IncomingMessage } from "node:http";

function mockRequest(headers: Record<string, string | string[]> = {}): IncomingMessage {
  return {
    headers,
  } as unknown as IncomingMessage;
}

vi.mock("node:crypto", () => ({ randomUUID: () => "uuid" }));

describe("http-utils", () => {
  describe("getHeader", () => {
    it("returns string header", () => {
      const req = mockRequest({ "x-test": "value" });
      expect(getHeader(req, "x-test")).toBe("value");
    });

    it("returns first element of array header", () => {
      const req = mockRequest({ "x-test": ["value1", "value2"] });
      expect(getHeader(req, "x-test")).toBe("value1");
    });

    it("returns undefined if header is missing", () => {
      const req = mockRequest({});
      expect(getHeader(req, "x-test")).toBeUndefined();
    });
  });

  describe("getBearerToken", () => {
    it("returns token", () => {
      const req = mockRequest({ authorization: "Bearer my-token" });
      expect(getBearerToken(req)).toBe("my-token");
    });

    it("returns token case insensitively", () => {
      const req = mockRequest({ authorization: "bearer my-token" });
      expect(getBearerToken(req)).toBe("my-token");
    });

    it("returns undefined if no authorization header", () => {
      const req = mockRequest({});
      expect(getBearerToken(req)).toBeUndefined();
    });

    it("returns undefined if not bearer token", () => {
      const req = mockRequest({ authorization: "Basic my-token" });
      expect(getBearerToken(req)).toBeUndefined();
    });

    it("returns undefined if bearer is empty", () => {
      const req = mockRequest({ authorization: "Bearer " });
      expect(getBearerToken(req)).toBeUndefined();
    });
  });

  describe("resolveAgentIdFromHeader", () => {
    it("resolves from x-openclaw-agent-id", () => {
      const req = mockRequest({ "x-openclaw-agent-id": "agent1" });
      expect(resolveAgentIdFromHeader(req)).toBe("agent1");
    });

    it("resolves from x-openclaw-agent", () => {
      const req = mockRequest({ "x-openclaw-agent": "agent2" });
      expect(resolveAgentIdFromHeader(req)).toBe("agent2");
    });

    it("returns undefined if headers missing", () => {
      const req = mockRequest({});
      expect(resolveAgentIdFromHeader(req)).toBeUndefined();
    });
  });

  describe("resolveAgentIdFromModel", () => {
    it("resolves from openclaw: prefix", () => {
      expect(resolveAgentIdFromModel("openclaw:agent1")).toBe("agent1");
    });

    it("resolves from openclaw/ prefix", () => {
      expect(resolveAgentIdFromModel("openclaw/agent2")).toBe("agent2");
    });

    it("resolves from agent: prefix", () => {
      expect(resolveAgentIdFromModel("agent:agent3")).toBe("agent3");
    });

    it("returns undefined for invalid format", () => {
      expect(resolveAgentIdFromModel("invalid")).toBeUndefined();
    });

    it("returns undefined for empty model", () => {
      expect(resolveAgentIdFromModel("")).toBeUndefined();
      expect(resolveAgentIdFromModel(undefined)).toBeUndefined();
    });
  });

  describe("resolveAgentIdForRequest", () => {
    it("prefers header over model", () => {
      const req = mockRequest({ "x-openclaw-agent": "agent1" });
      expect(resolveAgentIdForRequest({ req, model: "agent:agent2" })).toBe("agent1");
    });

    it("falls back to model if no header", () => {
      const req = mockRequest({});
      expect(resolveAgentIdForRequest({ req, model: "agent:agent2" })).toBe("agent2");
    });

    it("defaults to main if neither present", () => {
      const req = mockRequest({});
      expect(resolveAgentIdForRequest({ req, model: undefined })).toBe("main");
    });
  });

  describe("resolveSessionKey", () => {
    it("uses x-openclaw-session-key header if present", () => {
      const req = mockRequest({ "x-openclaw-session-key": "explicit-key" });
      expect(resolveSessionKey({ req, agentId: "agent1", prefix: "pref" })).toBe("explicit-key");
    });

    it("generates user-based key if user is provided", () => {
      const req = mockRequest({});
      const key = resolveSessionKey({ req, agentId: "agent1", user: "user1", prefix: "pref" });
      expect(key).toContain("agent1");
      expect(key).toContain("pref-user:user1");
    });

    it("generates random key if no user", () => {
      const req = mockRequest({});
      const key = resolveSessionKey({ req, agentId: "agent1", prefix: "pref" });
      expect(key).toContain("pref:");
      expect(key).toContain("agent1");
    });
  });

  describe("resolveGatewayRequestContext", () => {
    it("resolves context without message channel header", () => {
      const req = mockRequest({
        "x-openclaw-agent-id": "agent1",
        "x-openclaw-session-key": "key1",
      });
      const ctx = resolveGatewayRequestContext({
        req,
        model: "ignored",
        sessionPrefix: "pref",
        defaultMessageChannel: "default-channel",
      });
      expect(ctx.agentId).toBe("agent1");
      expect(ctx.sessionKey).toBe("key1");
      expect(ctx.messageChannel).toBe("default-channel");
    });

    it("resolves context with message channel header", () => {
      const req = mockRequest({
        "x-openclaw-agent-id": "agent1",
        "x-openclaw-session-key": "key1",
        "x-openclaw-message-channel": "custom-channel",
      });
      const ctx = resolveGatewayRequestContext({
        req,
        model: "ignored",
        sessionPrefix: "pref",
        defaultMessageChannel: "default-channel",
        useMessageChannelHeader: true,
      });
      expect(ctx.agentId).toBe("agent1");
      expect(ctx.sessionKey).toBe("key1");
      expect(ctx.messageChannel).toBe("custom-channel");
    });
  });
});
