import { describe, expect, it, vi } from "vitest";
import * as execApprovals from "../infra/exec-approvals.js";
import type {
  ExecAllowlistEntry,
  ExecCommandSegment,
  SkillBinTrustEntry,
} from "../infra/exec-approvals.js";
import {
  applyOutputTruncation,
  evaluateSystemRunAllowlist,
  resolvePlannedAllowlistArgv,
  resolveSystemRunExecArgv,
} from "./invoke-system-run-allowlist.js";
import type { RunResult } from "./invoke-types.js";

vi.mock("../infra/exec-approvals.js", () => ({
  evaluateShellAllowlist: vi.fn(),
  analyzeArgvCommand: vi.fn(),
  evaluateExecAllowlist: vi.fn(),
  resolvePlannedSegmentArgv: vi.fn(),
}));

describe("evaluateSystemRunAllowlist", () => {
  const baseParams = {
    approvals: { allowlist: [] as ExecAllowlistEntry[], ask: [], bindings: [] },
    security: "allowlist" as const,
    safeBins: [],
    safeBinProfiles: [],
    trustedSafeBinDirs: [],
    cwd: undefined,
    env: undefined,
    skillBins: [] as SkillBinTrustEntry[],
    autoAllowSkills: false,
  };

  it("should evaluate shell allowlist when shellCommand is provided", () => {
    const mockEval = {
      analysisOk: true,
      allowlistMatches: [{ pattern: "echo *" } as ExecAllowlistEntry],
      allowlistSatisfied: true,
      segments: [{ argv: ["echo", "test"], env: {} } as ExecCommandSegment],
    };
    vi.mocked(execApprovals.evaluateShellAllowlist).mockReturnValueOnce(mockEval);

    const result = evaluateSystemRunAllowlist({
      ...baseParams,
      shellCommand: "echo test",
      argv: [],
    });

    expect(execApprovals.evaluateShellAllowlist).toHaveBeenCalledWith(
      expect.objectContaining({ command: "echo test" })
    );
    expect(result).toEqual({
      analysisOk: true,
      allowlistMatches: mockEval.allowlistMatches,
      allowlistSatisfied: true,
      segments: mockEval.segments,
    });
  });

  it("should not satisfy allowlist if security is not allowlist for shellCommand", () => {
    vi.mocked(execApprovals.evaluateShellAllowlist).mockReturnValueOnce({
      analysisOk: true,
      allowlistMatches: [],
      allowlistSatisfied: true,
      segments: [],
    });

    const result = evaluateSystemRunAllowlist({
      ...baseParams,
      security: "none",
      shellCommand: "echo test",
      argv: [],
    });

    expect(result.allowlistSatisfied).toBe(false);
  });

  it("should evaluate exec allowlist when shellCommand is absent", () => {
    const mockAnalysis = { ok: true, segments: [{ argv: ["ls"], env: {} } as ExecCommandSegment] };
    const mockEval = { allowlistMatches: [], allowlistSatisfied: true };

    vi.mocked(execApprovals.analyzeArgvCommand).mockReturnValueOnce(mockAnalysis as unknown as ReturnType<typeof execApprovals.analyzeArgvCommand>);
    vi.mocked(execApprovals.evaluateExecAllowlist).mockReturnValueOnce(mockEval as unknown as ReturnType<typeof execApprovals.evaluateExecAllowlist>);

    const result = evaluateSystemRunAllowlist({
      ...baseParams,
      shellCommand: null,
      argv: ["ls"],
    });

    expect(execApprovals.analyzeArgvCommand).toHaveBeenCalledWith(
      expect.objectContaining({ argv: ["ls"] })
    );
    expect(execApprovals.evaluateExecAllowlist).toHaveBeenCalledWith(
      expect.objectContaining({ analysis: mockAnalysis })
    );
    expect(result).toEqual({
      analysisOk: true,
      allowlistMatches: [],
      allowlistSatisfied: true,
      segments: mockAnalysis.segments,
    });
  });

  it("should not satisfy allowlist if security is not allowlist for execCommand", () => {
    const mockAnalysis = { ok: true, segments: [] };
    const mockEval = { allowlistMatches: [], allowlistSatisfied: true };

    vi.mocked(execApprovals.analyzeArgvCommand).mockReturnValueOnce(mockAnalysis as unknown as ReturnType<typeof execApprovals.analyzeArgvCommand>);
    vi.mocked(execApprovals.evaluateExecAllowlist).mockReturnValueOnce(mockEval as unknown as ReturnType<typeof execApprovals.evaluateExecAllowlist>);

    const result = evaluateSystemRunAllowlist({
      ...baseParams,
      security: "none",
      shellCommand: null,
      argv: ["ls"],
    });

    expect(result.allowlistSatisfied).toBe(false);
  });
});

describe("resolvePlannedAllowlistArgv", () => {
  const baseParams = {
    security: "allowlist" as const,
    shellCommand: null,
    policy: {
      approvedByAsk: false,
      analysisOk: true,
      allowlistSatisfied: true,
    },
    segments: [{ argv: ["ls"], env: {} } as ExecCommandSegment],
  };

  it("should return undefined if security is not allowlist", () => {
    expect(resolvePlannedAllowlistArgv({ ...baseParams, security: "none" })).toBeUndefined();
  });

  it("should return undefined if approvedByAsk is true", () => {
    expect(
      resolvePlannedAllowlistArgv({ ...baseParams, policy: { ...baseParams.policy, approvedByAsk: true } })
    ).toBeUndefined();
  });

  it("should return undefined if shellCommand is truthy", () => {
    expect(resolvePlannedAllowlistArgv({ ...baseParams, shellCommand: "ls" })).toBeUndefined();
  });

  it("should return undefined if analysisOk is false", () => {
    expect(
      resolvePlannedAllowlistArgv({ ...baseParams, policy: { ...baseParams.policy, analysisOk: false } })
    ).toBeUndefined();
  });

  it("should return undefined if allowlistSatisfied is false", () => {
    expect(
      resolvePlannedAllowlistArgv({ ...baseParams, policy: { ...baseParams.policy, allowlistSatisfied: false } })
    ).toBeUndefined();
  });

  it("should return undefined if segments length is not 1", () => {
    expect(resolvePlannedAllowlistArgv({ ...baseParams, segments: [] })).toBeUndefined();
  });

  it("should return null if resolvePlannedSegmentArgv returns empty or undefined", () => {
    vi.mocked(execApprovals.resolvePlannedSegmentArgv).mockReturnValueOnce([]);
    expect(resolvePlannedAllowlistArgv(baseParams)).toBeNull();
  });

  it("should return planned args if conditions are met", () => {
    vi.mocked(execApprovals.resolvePlannedSegmentArgv).mockReturnValueOnce(["ls", "-la"]);
    expect(resolvePlannedAllowlistArgv(baseParams)).toEqual(["ls", "-la"]);
  });
});

describe("resolveSystemRunExecArgv", () => {
  const baseParams = {
    plannedAllowlistArgv: undefined,
    argv: ["ls"],
    security: "none" as const,
    isWindows: false,
    policy: {
      approvedByAsk: false,
      analysisOk: true,
      allowlistSatisfied: true,
    },
    shellCommand: null,
    segments: [] as ExecCommandSegment[],
  };

  it("should return plannedAllowlistArgv if provided", () => {
    expect(resolveSystemRunExecArgv({ ...baseParams, plannedAllowlistArgv: ["echo"] })).toEqual(["echo"]);
  });

  it("should return argv if plannedAllowlistArgv is undefined", () => {
    expect(resolveSystemRunExecArgv(baseParams)).toEqual(["ls"]);
  });

  it("should return segment argv if all conditions met on Windows", () => {
    const params = {
      ...baseParams,
      security: "allowlist" as const,
      isWindows: true,
      shellCommand: "echo test",
      segments: [{ argv: ["cmd.exe", "/d", "/s", "/c", "echo test"], env: {} } as ExecCommandSegment],
    };
    expect(resolveSystemRunExecArgv(params)).toEqual(["cmd.exe", "/d", "/s", "/c", "echo test"]);
  });

  it("should return argv if not Windows even if other conditions met", () => {
    const params = {
      ...baseParams,
      security: "allowlist" as const,
      isWindows: false,
      shellCommand: "echo test",
      segments: [{ argv: ["sh", "-c", "echo test"], env: {} } as ExecCommandSegment],
    };
    expect(resolveSystemRunExecArgv(params)).toEqual(["ls"]);
  });
});

describe("applyOutputTruncation", () => {
  it("should do nothing if not truncated", () => {
    const result = { truncated: false, stdout: "out", stderr: "err" } as unknown as RunResult;
    applyOutputTruncation(result);
    expect(result).toEqual({ truncated: false, stdout: "out", stderr: "err" });
  });

  it("should append to stderr if stderr has content", () => {
    const result = { truncated: true, stdout: "out", stderr: "err" } as unknown as RunResult;
    applyOutputTruncation(result);
    expect(result.stderr).toBe("err\n... (truncated)");
    expect(result.stdout).toBe("out");
  });

  it("should append to stdout if stderr is empty", () => {
    const result = { truncated: true, stdout: "out", stderr: "  " } as unknown as RunResult;
    applyOutputTruncation(result);
    expect(result.stdout).toBe("out\n... (truncated)");
    expect(result.stderr).toBe("  ");
  });
});
