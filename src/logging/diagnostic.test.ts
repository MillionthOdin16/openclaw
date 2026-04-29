import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onDiagnosticEvent, resetDiagnosticEventsForTest } from "../infra/diagnostic-events.js";
import {
  diagnosticSessionStates,
  getDiagnosticSessionStateCountForTest,
  getDiagnosticSessionState,
  pruneDiagnosticSessionStates,
  resetDiagnosticSessionStateForTest,
} from "./diagnostic-session-state.js";
import {
  diagnosticLogger,
  logActiveRuns,
  logLaneDequeue,
  logLaneEnqueue,
  logMessageProcessed,
  logMessageQueued,
  logRunAttempt,
  logSessionStateChange,
  logToolLoopAction,
  logWebhookError,
  logWebhookProcessed,
  logWebhookReceived,
  resetDiagnosticStateForTest,
  resolveStuckSessionWarnMs,
  startDiagnosticHeartbeat,
} from "./diagnostic.js";

describe("diagnostic session state pruning", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetDiagnosticSessionStateForTest();
  });

  afterEach(() => {
    resetDiagnosticSessionStateForTest();
    vi.useRealTimers();
  });

  it("evicts stale idle session states", () => {
    getDiagnosticSessionState({ sessionId: "stale-1" });
    expect(getDiagnosticSessionStateCountForTest()).toBe(1);

    vi.advanceTimersByTime(31 * 60 * 1000);
    getDiagnosticSessionState({ sessionId: "fresh-1" });

    expect(getDiagnosticSessionStateCountForTest()).toBe(1);
  });

  it("caps tracked session states to a bounded max", () => {
    const now = Date.now();
    for (let i = 0; i < 2001; i += 1) {
      diagnosticSessionStates.set(`session-${i}`, {
        sessionId: `session-${i}`,
        lastActivity: now + i,
        state: "idle",
        queueDepth: 1,
      });
    }
    pruneDiagnosticSessionStates(now + 2002, true);

    expect(getDiagnosticSessionStateCountForTest()).toBe(2000);
  });

  it("reuses keyed session state when later looked up by sessionId", () => {
    const keyed = getDiagnosticSessionState({
      sessionId: "s1",
      sessionKey: "agent:main:discord:channel:c1",
    });
    const bySessionId = getDiagnosticSessionState({ sessionId: "s1" });

    expect(bySessionId).toBe(keyed);
    expect(bySessionId.sessionKey).toBe("agent:main:discord:channel:c1");
    expect(getDiagnosticSessionStateCountForTest()).toBe(1);
  });
});

describe("diagnostic logging functions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetDiagnosticStateForTest();
    resetDiagnosticEventsForTest();
    vi.spyOn(diagnosticLogger, "isEnabled").mockReturnValue(true);
  });

  afterEach(() => {
    resetDiagnosticEventsForTest();
    resetDiagnosticStateForTest();
    vi.useRealTimers();
  });

  it("logWebhookReceived emits event and logs debug", () => {
    const events: any[] = [];
    const unsubscribe = onDiagnosticEvent((event) => events.push(event));
    const debugSpy = vi.spyOn(diagnosticLogger, "debug");

    logWebhookReceived({ channel: "discord", updateType: "message", chatId: 123 });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "webhook.received",
      channel: "discord",
      updateType: "message",
      chatId: 123,
    });
    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("webhook received: channel=discord"));

    unsubscribe();
  });

  it("logWebhookProcessed emits event and logs debug", () => {
    const events: any[] = [];
    const unsubscribe = onDiagnosticEvent((event) => events.push(event));
    const debugSpy = vi.spyOn(diagnosticLogger, "debug");

    logWebhookProcessed({ channel: "telegram", updateType: "callback", chatId: "abc", durationMs: 42 });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "webhook.processed",
      channel: "telegram",
      updateType: "callback",
      chatId: "abc",
      durationMs: 42,
    });
    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("webhook processed: channel=telegram"));

    unsubscribe();
  });

  it("logWebhookError emits event and logs error", () => {
    const events: any[] = [];
    const unsubscribe = onDiagnosticEvent((event) => events.push(event));
    const errorSpy = vi.spyOn(diagnosticLogger, "error");

    logWebhookError({ channel: "slack", error: "network timeout" });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "webhook.error",
      channel: "slack",
      error: "network timeout",
    });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('webhook error: channel=slack type=unknown chatId=unknown error="network timeout"'));

    unsubscribe();
  });

  it("logMessageQueued emits event and logs debug", () => {
    const events: any[] = [];
    const unsubscribe = onDiagnosticEvent((event) => events.push(event));
    const debugSpy = vi.spyOn(diagnosticLogger, "debug");

    logMessageQueued({ sessionId: "s1", source: "user" });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "message.queued",
      sessionId: "s1",
      source: "user",
      queueDepth: 1,
    });
    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("message queued: sessionId=s1"));

    unsubscribe();
  });

  it("logMessageProcessed emits event and logs appropriate level", () => {
    const events: any[] = [];
    const unsubscribe = onDiagnosticEvent((event) => events.push(event));
    const debugSpy = vi.spyOn(diagnosticLogger, "debug");
    const errorSpy = vi.spyOn(diagnosticLogger, "error");

    logMessageProcessed({ channel: "discord", outcome: "completed", durationMs: 100 });
    logMessageProcessed({ channel: "discord", outcome: "error", error: "fail" });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ type: "message.processed", outcome: "completed", durationMs: 100 });
    expect(events[1]).toMatchObject({ type: "message.processed", outcome: "error", error: "fail" });

    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("message processed: channel=discord"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("message processed: channel=discord"));

    unsubscribe();
  });

  it("logSessionStateChange logs queueDepth updates", () => {
    const events: any[] = [];
    const unsubscribe = onDiagnosticEvent((event) => events.push(event));
    const debugSpy = vi.spyOn(diagnosticLogger, "debug");

    // Enqueue first
    logMessageQueued({ sessionId: "s1", source: "user" });
    logSessionStateChange({ sessionId: "s1", state: "processing" });
    logSessionStateChange({ sessionId: "s1", state: "idle" });

    expect(events).toHaveLength(3); // queued, state processing, state idle
    expect(events[2]).toMatchObject({
      type: "session.state",
      sessionId: "s1",
      state: "idle",
      queueDepth: 0,
    });
    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("session state: sessionId=s1"));

    unsubscribe();
  });

  it("logLaneEnqueue and logLaneDequeue emit correctly", () => {
    const events: any[] = [];
    const unsubscribe = onDiagnosticEvent((event) => events.push(event));
    const debugSpy = vi.spyOn(diagnosticLogger, "debug");

    logLaneEnqueue("lane1", 5);
    logLaneDequeue("lane1", 100, 4);

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ type: "queue.lane.enqueue", lane: "lane1", queueSize: 5 });
    expect(events[1]).toMatchObject({ type: "queue.lane.dequeue", lane: "lane1", queueSize: 4, waitMs: 100 });

    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("lane enqueue: lane=lane1 queueSize=5"));
    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("lane dequeue: lane=lane1 waitMs=100 queueSize=4"));

    unsubscribe();
  });

  it("logRunAttempt emits correctly", () => {
    const events: any[] = [];
    const unsubscribe = onDiagnosticEvent((event) => events.push(event));
    const debugSpy = vi.spyOn(diagnosticLogger, "debug");

    logRunAttempt({ sessionId: "s1", runId: "r1", attempt: 2 });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "run.attempt", sessionId: "s1", runId: "r1", attempt: 2 });
    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("run attempt: sessionId=s1"));

    unsubscribe();
  });

  it("logToolLoopAction emits event and logs appropriate level", () => {
    const events: any[] = [];
    const unsubscribe = onDiagnosticEvent((event) => events.push(event));
    const warnSpy = vi.spyOn(diagnosticLogger, "warn");
    const errorSpy = vi.spyOn(diagnosticLogger, "error");

    logToolLoopAction({
      toolName: "testTool",
      level: "warning",
      action: "warn",
      detector: "generic_repeat",
      count: 3,
      message: "repeating",
    });

    logToolLoopAction({
      toolName: "testTool2",
      level: "critical",
      action: "block",
      detector: "ping_pong",
      count: 5,
      message: "blocked",
      pairedToolName: "testTool3",
    });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ type: "tool.loop", level: "warning" });
    expect(events[1]).toMatchObject({ type: "tool.loop", level: "critical", pairedToolName: "testTool3" });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("tool loop:"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("tool loop:"));

    unsubscribe();
  });

  it("logActiveRuns emits correctly", () => {
    const debugSpy = vi.spyOn(diagnosticLogger, "debug");

    logSessionStateChange({ sessionId: "active1", state: "processing" });
    logActiveRuns();

    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("active runs: count=1"));
  });
});

describe("logger import side effects", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("does not mkdir at import time", async () => {
    vi.useRealTimers();
    vi.resetModules();

    const mkdirSpy = vi.spyOn(fs, "mkdirSync");

    await import("./logger.js");

    expect(mkdirSpy).not.toHaveBeenCalled();
  });
});

describe("stuck session diagnostics threshold", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetDiagnosticStateForTest();
    resetDiagnosticEventsForTest();
  });

  afterEach(() => {
    resetDiagnosticEventsForTest();
    resetDiagnosticStateForTest();
    vi.useRealTimers();
  });

  it("uses the configured diagnostics.stuckSessionWarnMs threshold", () => {
    const events: Array<{ type: string }> = [];
    const unsubscribe = onDiagnosticEvent((event) => {
      events.push({ type: event.type });
    });
    try {
      startDiagnosticHeartbeat({
        diagnostics: {
          enabled: true,
          stuckSessionWarnMs: 30_000,
        },
      });
      logSessionStateChange({ sessionId: "s1", sessionKey: "main", state: "processing" });
      vi.advanceTimersByTime(61_000);
    } finally {
      unsubscribe();
    }

    expect(events.filter((event) => event.type === "session.stuck")).toHaveLength(1);
  });

  it("falls back to default threshold when config is absent", () => {
    const events: Array<{ type: string }> = [];
    const unsubscribe = onDiagnosticEvent((event) => {
      events.push({ type: event.type });
    });
    try {
      startDiagnosticHeartbeat();
      logSessionStateChange({ sessionId: "s2", sessionKey: "main", state: "processing" });
      vi.advanceTimersByTime(31_000);
    } finally {
      unsubscribe();
    }

    expect(events.filter((event) => event.type === "session.stuck")).toHaveLength(0);
  });

  it("uses default threshold for invalid values", () => {
    expect(resolveStuckSessionWarnMs({ diagnostics: { stuckSessionWarnMs: -1 } })).toBe(120_000);
    expect(resolveStuckSessionWarnMs({ diagnostics: { stuckSessionWarnMs: 0 } })).toBe(120_000);
    expect(resolveStuckSessionWarnMs()).toBe(120_000);
  });
});
