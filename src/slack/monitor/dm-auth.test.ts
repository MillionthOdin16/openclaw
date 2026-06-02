import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import * as pairingChallenge from "../../pairing/pairing-challenge.js";
import type { SlackMonitorContext } from "./context.js";
import { authorizeSlackDirectMessage } from "./dm-auth.js";

vi.mock("../../pairing/pairing-store.js", () => ({
  upsertChannelPairingRequest: vi.fn(),
}));

vi.mock("../../pairing/pairing-challenge.js", () => ({
  issuePairingChallenge: vi.fn(),
}));

describe("authorizeSlackDirectMessage", () => {
  let mockOnDisabled: Mock;
  let mockOnUnauthorized: Mock;
  let mockLog: Mock;
  let mockResolveSenderName: Mock;
  let mockSendPairingReply: Mock;

  beforeEach(() => {
    mockOnDisabled = vi.fn();
    mockOnUnauthorized = vi.fn();
    mockLog = vi.fn();
    mockResolveSenderName = vi.fn().mockResolvedValue({ name: "TestUser" });
    mockSendPairingReply = vi.fn();
    vi.clearAllMocks();
  });

  function createCtx(dmEnabled: boolean, dmPolicy: string): SlackMonitorContext {
    return {
      dmEnabled,
      dmPolicy,
      allowNameMatching: false,
    } as unknown as SlackMonitorContext;
  }

  it("returns false and calls onDisabled when dmEnabled is false", async () => {
    const result = await authorizeSlackDirectMessage({
      ctx: createCtx(false, "open"),
      accountId: "test",
      senderId: "U1",
      allowFromLower: [],
      resolveSenderName: mockResolveSenderName,
      sendPairingReply: mockSendPairingReply,
      onDisabled: mockOnDisabled,
      onUnauthorized: mockOnUnauthorized,
      log: mockLog,
    });

    expect(result).toBe(false);
    expect(mockOnDisabled).toHaveBeenCalledTimes(1);
    expect(mockOnUnauthorized).not.toHaveBeenCalled();
    expect(pairingChallenge.issuePairingChallenge).not.toHaveBeenCalled();
  });

  it("returns false and calls onDisabled when dmPolicy is disabled", async () => {
    const result = await authorizeSlackDirectMessage({
      ctx: createCtx(true, "disabled"),
      accountId: "test",
      senderId: "U1",
      allowFromLower: [],
      resolveSenderName: mockResolveSenderName,
      sendPairingReply: mockSendPairingReply,
      onDisabled: mockOnDisabled,
      onUnauthorized: mockOnUnauthorized,
      log: mockLog,
    });

    expect(result).toBe(false);
    expect(mockOnDisabled).toHaveBeenCalledTimes(1);
    expect(mockOnUnauthorized).not.toHaveBeenCalled();
    expect(pairingChallenge.issuePairingChallenge).not.toHaveBeenCalled();
  });

  it("returns false and calls onDisabled when dmEnabled is false and dmPolicy is open", async () => {
    const result = await authorizeSlackDirectMessage({
      ctx: createCtx(false, "open"),
      accountId: "test",
      senderId: "U1",
      allowFromLower: [],
      resolveSenderName: mockResolveSenderName,
      sendPairingReply: mockSendPairingReply,
      onDisabled: mockOnDisabled,
      onUnauthorized: mockOnUnauthorized,
      log: mockLog,
    });

    expect(result).toBe(false);
    expect(mockOnDisabled).toHaveBeenCalledTimes(1);
    expect(mockOnUnauthorized).not.toHaveBeenCalled();
    expect(pairingChallenge.issuePairingChallenge).not.toHaveBeenCalled();
  });

  it("returns true when dmEnabled is true and dmPolicy is open", async () => {
    const result = await authorizeSlackDirectMessage({
      ctx: createCtx(true, "open"),
      accountId: "test",
      senderId: "U1",
      allowFromLower: [],
      resolveSenderName: mockResolveSenderName,
      sendPairingReply: mockSendPairingReply,
      onDisabled: mockOnDisabled,
      onUnauthorized: mockOnUnauthorized,
      log: mockLog,
    });

    expect(result).toBe(true);
    expect(mockOnDisabled).not.toHaveBeenCalled();
    expect(mockOnUnauthorized).not.toHaveBeenCalled();
    expect(pairingChallenge.issuePairingChallenge).not.toHaveBeenCalled();
  });

  it("returns true when sender is allowlisted", async () => {
    const result = await authorizeSlackDirectMessage({
      ctx: createCtx(true, "allowlist"),
      accountId: "test",
      senderId: "U1",
      allowFromLower: ["u1"],
      resolveSenderName: mockResolveSenderName,
      sendPairingReply: mockSendPairingReply,
      onDisabled: mockOnDisabled,
      onUnauthorized: mockOnUnauthorized,
      log: mockLog,
    });

    expect(result).toBe(true);
    expect(mockOnDisabled).not.toHaveBeenCalled();
    expect(mockOnUnauthorized).not.toHaveBeenCalled();
    expect(pairingChallenge.issuePairingChallenge).not.toHaveBeenCalled();
  });

  it("issues pairing challenge when policy is pairing and sender is not allowlisted", async () => {
    const result = await authorizeSlackDirectMessage({
      ctx: createCtx(true, "pairing"),
      accountId: "test",
      senderId: "U2",
      allowFromLower: ["u1"],
      resolveSenderName: mockResolveSenderName,
      sendPairingReply: mockSendPairingReply,
      onDisabled: mockOnDisabled,
      onUnauthorized: mockOnUnauthorized,
      log: mockLog,
    });

    expect(result).toBe(false);
    expect(mockOnDisabled).not.toHaveBeenCalled();
    expect(mockOnUnauthorized).not.toHaveBeenCalled();
    expect(pairingChallenge.issuePairingChallenge).toHaveBeenCalledTimes(1);
    expect(pairingChallenge.issuePairingChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "slack",
        senderId: "U2",
      }),
    );
  });

  it("calls onUnauthorized when policy is allowlist and sender is not allowlisted", async () => {
    const result = await authorizeSlackDirectMessage({
      ctx: createCtx(true, "allowlist"),
      accountId: "test",
      senderId: "U2",
      allowFromLower: ["u1"],
      resolveSenderName: mockResolveSenderName,
      sendPairingReply: mockSendPairingReply,
      onDisabled: mockOnDisabled,
      onUnauthorized: mockOnUnauthorized,
      log: mockLog,
    });

    expect(result).toBe(false);
    expect(mockOnDisabled).not.toHaveBeenCalled();
    expect(mockOnUnauthorized).toHaveBeenCalledTimes(1);
    expect(pairingChallenge.issuePairingChallenge).not.toHaveBeenCalled();
  });
});
