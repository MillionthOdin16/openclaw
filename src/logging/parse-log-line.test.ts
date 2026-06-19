import { describe, expect, it } from "vitest";
import { parseLogLine } from "./parse-log-line.js";

describe("parseLogLine", () => {
  it("parses structured JSON log lines", () => {
    const line = JSON.stringify({
      time: "2026-01-09T01:38:41.523Z",
      0: '{"subsystem":"gateway/channels/whatsapp"}',
      1: "connected",
      _meta: {
        name: '{"subsystem":"gateway/channels/whatsapp"}',
        logLevelName: "INFO",
      },
    });

    const parsed = parseLogLine(line);

    expect(parsed).not.toBeNull();
    expect(parsed?.time).toBe("2026-01-09T01:38:41.523Z");
    expect(parsed?.level).toBe("info");
    expect(parsed?.subsystem).toBe("gateway/channels/whatsapp");
    expect(parsed?.message).toBe('{"subsystem":"gateway/channels/whatsapp"} connected');
    expect(parsed?.raw).toBe(line);
  });

  it("falls back to meta timestamp when top-level time is missing", () => {
    const line = JSON.stringify({
      0: "hello",
      _meta: {
        name: '{"subsystem":"gateway"}',
        logLevelName: "WARN",
        date: "2026-01-09T02:10:00.000Z",
      },
    });

    const parsed = parseLogLine(line);

    expect(parsed?.time).toBe("2026-01-09T02:10:00.000Z");
    expect(parsed?.level).toBe("warn");
  });

  it("returns null for invalid JSON", () => {
    expect(parseLogLine("not-json")).toBeNull();
  });

  it("extracts non-string messages by stringifying them", () => {
    const line = JSON.stringify({
      0: { error: "something went wrong", code: 500 },
      _meta: {},
    });

    const parsed = parseLogLine(line);
    expect(parsed?.message).toBe('{"error":"something went wrong","code":500}');
  });

  it("handles non-string meta.name", () => {
    const line = JSON.stringify({
      0: "hello",
      _meta: {
        name: 123,
      },
    });

    const parsed = parseLogLine(line);
    expect(parsed?.subsystem).toBeUndefined();
    expect(parsed?.module).toBeUndefined();
  });

  it("handles invalid JSON in meta.name", () => {
    const line = JSON.stringify({
      0: "hello",
      _meta: {
        name: "not-json",
      },
    });

    const parsed = parseLogLine(line);
    expect(parsed?.subsystem).toBeUndefined();
    expect(parsed?.module).toBeUndefined();
  });

  it("handles valid JSON with module in meta.name", () => {
    const line = JSON.stringify({
      0: "hello",
      _meta: {
        name: '{"subsystem":"core","module":"auth"}',
      },
    });

    const parsed = parseLogLine(line);
    expect(parsed?.subsystem).toBe("core");
    expect(parsed?.module).toBe("auth");
  });
});
