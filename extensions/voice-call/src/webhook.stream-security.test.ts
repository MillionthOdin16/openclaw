import { describe, it, expect, vi, afterEach } from "vitest";
import { VoiceCallWebhookServer } from "./webhook.js";
import { MockProvider } from "./providers/mock.js";
import { CallManager } from "./manager.js";
import { WebSocket } from "ws";
import fs from "fs";
import path from "path";
import os from "os";

// Mock STT Provider
vi.mock("./providers/stt-openai-realtime.js", () => {
  return {
    OpenAIRealtimeSTTProvider: class {
      createSession() {
        return {
          connect: async () => {},
          sendAudio: () => {},
          waitForTranscript: async () => "",
          onPartial: () => {},
          onTranscript: () => {},
          onSpeechStart: () => {},
          close: () => {},
          isConnected: () => true,
        };
      }
    },
  };
});

describe("VoiceCallWebhookServer Stream Security", () => {
  let server: VoiceCallWebhookServer;
  let manager: CallManager;
  let ws: WebSocket;
  const tempStore = path.join(os.tmpdir(), "voice-call-test-store-" + Date.now());

  afterEach(async () => {
    if (ws) {
      ws.close();
    }
    if (server) {
      await server.stop();
    }
    if (fs.existsSync(tempStore)) {
      fs.rmSync(tempStore, { recursive: true, force: true });
    }
  });

  it("rejects WebSocket connection without token for MockProvider (non-secure)", async () => {
    const config: any = {
      enabled: true,
      provider: "mock",
      serve: { port: 0, bind: "127.0.0.1", path: "/voice" }, // Use port 0 for random port
      streaming: { enabled: true, openaiApiKey: "test" },
      twilio: {},
      outbound: { defaultMode: "conversation", notifyHangupDelaySec: 5 },
      maxConcurrentCalls: 10,
    };

    const provider = new MockProvider();
    manager = new CallManager(config, tempStore);
    manager.initialize(provider, "http://localhost/voice");

    server = new VoiceCallWebhookServer(config, manager, provider);
    await server.start();
    // WORKAROUND: webhook.ts returns port 0 in URL when config.port is 0,
    // so we get the actual port from the underlying server instance.
    const port = (server as any).server.address().port;

    // Initiate a call to have a valid callId
    const { callId } = await manager.initiateCall("+15550001234");
    const providerCallId = manager.getCall(callId)?.providerCallId;
    expect(providerCallId).toBeDefined();

    // Connect to WebSocket
    const wsUrl = `ws://127.0.0.1:${port}/voice/stream`;

    ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      ws.on("open", resolve);
      ws.on("error", reject);
    });

    // Send start message without token
    const startMsg = {
      event: "start",
      start: {
        callSid: providerCallId,
        streamSid: "stream-123",
      },
    };

    ws.send(JSON.stringify(startMsg));

    // Wait for connection to be accepted (or rejected)
    // If accepted, we should NOT receive a close frame immediately.
    // If rejected, we should receive a close frame with 1008.

    const closePromise = new Promise<{ code: number; reason: string }>((resolve) => {
      ws.on("close", (code, reason) => resolve({ code, reason: reason.toString() }));
    });

    // Wait a bit to see if it closes.
    const result = await Promise.race([
      closePromise,
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 500)),
    ]);

    // Should be rejected
    expect(result).not.toBe("timeout");
    if (typeof result === "object") {
        expect(result.code).toBe(1008);
    }
  });
});
