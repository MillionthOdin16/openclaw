import { describe, expect, it, vi } from "vitest";
import type { ProgressReporter } from "../../cli/progress.js";
import { buildStatusAllReportLines } from "./report-lines.js";

const diagnosisSpy = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("./diagnosis.js", () => ({
  appendStatusAllDiagnosis: diagnosisSpy,
}));

describe("buildStatusAllReportLines", () => {
  it("renders bootstrap column using file-presence semantics", async () => {
    const progress: ProgressReporter = {
      setLabel: () => {},
      setPercent: () => {},
      tick: () => {},
      done: () => {},
    };
    const lines = await buildStatusAllReportLines({
      progress,
      overviewRows: [{ Item: "Gateway", Value: "ok" }],
      channels: {
        rows: [
          {
            id: "mock-channel-warn",
            label: "Mock Warn",
            enabled: true,
            state: "warn",
            detail: "mock warn detail",
          },
          {
            id: "mock-channel-setup",
            label: "Mock Setup",
            enabled: false,
            state: "setup",
            detail: "mock setup detail",
          },
          {
            id: "mock-channel-off",
            label: "Mock Off",
            enabled: false,
            state: "off",
            detail: "mock off detail",
          },
        ],
        details: [
          {
            title: "Mock Details",
            columns: ["Name", "Status", "Notes"],
            rows: [
              { Name: "Row 1", Status: "OK", Notes: "Notes 1" },
              { Name: "Row 2", Status: "WARN", Notes: "Notes 2" },
              { Name: "Row 3", Status: "OTHER", Notes: "Notes 3" },
            ],
          },
        ],
      },
      channelIssues: [{ channel: "mock-channel-warn", message: "mock channel issue" }],
      agentStatus: {
        agents: [
          {
            id: "main",
            bootstrapPending: true,
            sessionsCount: 1,
            lastActiveAgeMs: 12_000,
            sessionsPath: "/tmp/main-sessions.json",
          },
          {
            id: "ops",
            bootstrapPending: false,
            sessionsCount: 0,
            lastActiveAgeMs: null,
            sessionsPath: "/tmp/ops-sessions.json",
          },
        ],
      },
      connectionDetailsForReport: "",
      diagnosis: {
        snap: null,
        remoteUrlMissing: false,
        sentinel: null,
        lastErr: null,
        port: 18789,
        portUsage: null,
        tailscaleMode: "off",
        tailscale: {
          backendState: null,
          dnsName: null,
          ips: [],
          error: null,
        },
        tailscaleHttpsUrl: null,
        skillStatus: null,
        channelsStatus: null,
        channelIssues: [],
        gatewayReachable: false,
        health: null,
      },
    });

    const output = lines.join("\n");
    expect(output).toContain("Bootstrap file");
    expect(output).toContain("PRESENT");
    expect(output).toContain("ABSENT");

    // Assert coverage for newly added mocked data
    expect(output).toContain("Mock Warn");
    expect(output).toContain("mock channel issue");
    expect(output).toContain("Mock Details");
    expect(output).toContain("Notes 1");
    expect(output).toContain("Notes 2");
    expect(output).toContain("Notes 3");
  });
});
