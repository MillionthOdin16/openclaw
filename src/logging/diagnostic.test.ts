import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onDiagnosticEvent, resetDiagnosticEventsForTest } from "../infra/diagnostic-events.js";
import {
  diagnosticSessionStates,
  getDiagnosticSessionState,
  pruneDiagnosticSessionStates,
  resetDiagnosticSessionStateForTest,
} from "./diagnostic-session-state.js";
import {
  logSessionStateChange,
  resetDiagnosticStateForTest,
  resolveStuckSessionWarnMs,
  startDiagnosticHeartbeat,
  logWebhookReceived,
  logWebhookProcessed,
  logWebhookError,
  logMessageQueued,
  logMessageProcessed,
  logSessionStuck,
  logLaneEnqueue,
  logLaneDequeue,
  logRunAttempt,
  logToolLoopAction,
  logActiveRuns,
  diagnosticLogger,
  getDiagnosticSessionStateCountForTest,
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

describe("diagnostic logging functions", () => {
  let events: any[] = [];
  let unsubscribe: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    resetDiagnosticStateForTest();
    resetDiagnosticEventsForTest();
    events = [];
    unsubscribe = onDiagnosticEvent((event) => {
      events.push(event);
    });

    vi.spyOn(diagnosticLogger, "debug").mockImplementation(() => {});
    vi.spyOn(diagnosticLogger, "warn").mockImplementation(() => {});
    vi.spyOn(diagnosticLogger, "error").mockImplementation(() => {});
    vi.spyOn(diagnosticLogger, "isEnabled").mockReturnValue(true);
  });

  afterEach(() => {
    unsubscribe();
    resetDiagnosticEventsForTest();
    resetDiagnosticStateForTest();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("logWebhookReceived updates stats and emits event", () => {
    logWebhookReceived({ channel: "test", updateType: "msg", chatId: 123 });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "webhook.received",
      channel: "test",
      updateType: "msg",
      chatId: 123,
    });
    expect(diagnosticLogger.debug).toHaveBeenCalled();
  });

  it("logWebhookProcessed updates stats and emits event", () => {
    logWebhookProcessed({ channel: "test", updateType: "msg", chatId: 123, durationMs: 42 });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "webhook.processed",
      channel: "test",
      updateType: "msg",
      chatId: 123,
      durationMs: 42,
    });
    expect(diagnosticLogger.debug).toHaveBeenCalled();
  });

  it("logWebhookError updates stats and emits event", () => {
    logWebhookError({ channel: "test", updateType: "msg", chatId: 123, error: "boom" });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "webhook.error",
      channel: "test",
      updateType: "msg",
      chatId: 123,
      error: "boom",
    });
    expect(diagnosticLogger.error).toHaveBeenCalled();
  });

  it("logMessageQueued updates queue depth and emits event", () => {
    logMessageQueued({ sessionId: "s1", source: "test" });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "message.queued",
      sessionId: "s1",
      source: "test",
      queueDepth: 1,
    });
    expect(diagnosticLogger.debug).toHaveBeenCalled();
  });

  it("logMessageProcessed emits event with outcome", () => {
    logMessageProcessed({ channel: "test", outcome: "completed", durationMs: 10 });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "message.processed",
      channel: "test",
      outcome: "completed",
      durationMs: 10,
    });
    expect(diagnosticLogger.debug).toHaveBeenCalled();
  });

  it("logMessageProcessed emits error when outcome is error", () => {
    logMessageProcessed({ channel: "test", outcome: "error", error: "fail" });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "message.processed",
      channel: "test",
      outcome: "error",
      error: "fail",
    });
    expect(diagnosticLogger.error).toHaveBeenCalled();
  });

  it("logLaneEnqueue emits event", () => {
    logLaneEnqueue("lane1", 5);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "queue.lane.enqueue",
      lane: "lane1",
      queueSize: 5,
    });
    expect(diagnosticLogger.debug).toHaveBeenCalled();
  });

  it("logLaneDequeue emits event", () => {
    logLaneDequeue("lane1", 100, 4);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "queue.lane.dequeue",
      lane: "lane1",
      queueSize: 4,
      waitMs: 100,
    });
    expect(diagnosticLogger.debug).toHaveBeenCalled();
  });

  it("logRunAttempt emits event", () => {
    logRunAttempt({ sessionId: "s1", runId: "r1", attempt: 2 });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "run.attempt",
      sessionId: "s1",
      runId: "r1",
      attempt: 2,
    });
    expect(diagnosticLogger.debug).toHaveBeenCalled();
  });

  it("logToolLoopAction emits event", () => {
    logToolLoopAction({
      sessionId: "s1",
      toolName: "t1",
      level: "warning",
      action: "warn",
      detector: "ping_pong",
      count: 3,
      message: "msg",
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "tool.loop",
      sessionId: "s1",
      toolName: "t1",
      level: "warning",
      action: "warn",
      detector: "ping_pong",
      count: 3,
      message: "msg",
    });
    expect(diagnosticLogger.warn).toHaveBeenCalled();
  });

  it("logToolLoopAction logs error on critical level", () => {
    logToolLoopAction({
      sessionId: "s1",
      toolName: "t1",
      level: "critical",
      action: "block",
      detector: "generic_repeat",
      count: 10,
      message: "msg",
    });
    expect(events).toHaveLength(1);
    expect(diagnosticLogger.error).toHaveBeenCalled();
  });

  it("logActiveRuns emits active sessions count to debug", () => {
    logSessionStateChange({ sessionId: "s1", state: "processing" });
    logActiveRuns();
    expect(diagnosticLogger.debug).toHaveBeenCalledWith(expect.stringContaining("active runs: count=1"));
  });

  it("getDiagnosticSessionStateCountForTest returns count", () => {
    logSessionStateChange({ sessionId: "s1", state: "processing" });
    expect(getDiagnosticSessionStateCountForTest()).toBe(1);
  });
});
