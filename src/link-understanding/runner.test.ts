import { describe, expect, it, vi, beforeEach } from "vitest";
import { runLinkUnderstanding } from "./runner.js";
import type { MsgContext } from "../auto-reply/templating.js";
import type { OpenClawConfig } from "../config/config.js";

// Mock dependencies
const mockRunExec = vi.fn();
vi.mock("../process/exec.js", () => ({
  runExec: (...args: unknown[]) => mockRunExec(...args),
}));

vi.mock("../globals.js", () => ({
  shouldLogVerbose: () => false,
  logVerbose: vi.fn(),
}));

describe("runLinkUnderstanding", () => {
  const baseCtx: MsgContext = {
    Body: "Hello world",
    SessionKey: "test-session",
    Provider: "discord",
    ChatType: "dm",
  };

  const baseConfig: OpenClawConfig = {
    tools: {
      links: {
        enabled: true,
        models: [
          {
            type: "cli",
            command: "echo",
            args: ["{{LinkUrl}}"],
          },
        ],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRunExec.mockResolvedValue({ stdout: "mock output", stderr: "" });
  });

  it("returns empty result if feature is disabled", async () => {
    const config: OpenClawConfig = {
      tools: { links: { enabled: false } },
    };
    const result = await runLinkUnderstanding({ cfg: config, ctx: baseCtx });
    expect(result).toEqual({ urls: [], outputs: [] });
    expect(mockRunExec).not.toHaveBeenCalled();
  });

  it("returns empty result if scope is denied", async () => {
    const config: OpenClawConfig = {
      tools: {
        links: {
          enabled: true,
          scope: { default: "deny" },
        },
      },
    };
    const result = await runLinkUnderstanding({ cfg: config, ctx: baseCtx });
    expect(result).toEqual({ urls: [], outputs: [] });
    expect(mockRunExec).not.toHaveBeenCalled();
  });

  it("returns empty result if no links are found", async () => {
    const ctx = { ...baseCtx, Body: "No links here" };
    const result = await runLinkUnderstanding({ cfg: baseConfig, ctx });
    expect(result).toEqual({ urls: [], outputs: [] });
    expect(mockRunExec).not.toHaveBeenCalled();
  });

  it("returns urls but no outputs if no models configured", async () => {
    const config: OpenClawConfig = {
      tools: {
        links: {
          enabled: true,
          models: [], // No models
        },
      },
    };
    const ctx = { ...baseCtx, Body: "Check https://example.com" };
    const result = await runLinkUnderstanding({ cfg: config, ctx });
    expect(result).toEqual({
      urls: ["https://example.com"],
      outputs: [],
    });
    expect(mockRunExec).not.toHaveBeenCalled();
  });

  it("executes command for found link", async () => {
    const ctx = { ...baseCtx, Body: "Check https://example.com" };

    mockRunExec.mockResolvedValueOnce({ stdout: "Processed content", stderr: "" });

    const result = await runLinkUnderstanding({ cfg: baseConfig, ctx });

    expect(result.urls).toEqual(["https://example.com"]);
    expect(result.outputs).toEqual(["Processed content"]);
    expect(mockRunExec).toHaveBeenCalledWith(
      "echo",
      ["https://example.com"],
      expect.objectContaining({ timeoutMs: expect.any(Number) })
    );
  });

  it("handles multiple links and deduplicates", async () => {
    const ctx = { ...baseCtx, Body: "A https://a.com and https://b.com and https://a.com again" };

    mockRunExec
      .mockResolvedValueOnce({ stdout: "Output A", stderr: "" })
      .mockResolvedValueOnce({ stdout: "Output B", stderr: "" });

    const result = await runLinkUnderstanding({ cfg: baseConfig, ctx });

    expect(result.urls).toEqual(["https://a.com", "https://b.com"]);
    expect(result.outputs).toEqual(["Output A", "Output B"]);
    expect(mockRunExec).toHaveBeenCalledTimes(2);
  });

  it("respects maxLinks configuration", async () => {
    const config: OpenClawConfig = {
      tools: {
        links: {
          ...baseConfig.tools?.links,
          maxLinks: 1,
        },
      },
    };
    const ctx = { ...baseCtx, Body: "https://a.com https://b.com" };

    mockRunExec.mockResolvedValueOnce({ stdout: "Output A", stderr: "" });

    const result = await runLinkUnderstanding({ cfg: config, ctx });

    expect(result.urls).toEqual(["https://a.com"]); // Only one link
    expect(result.outputs).toHaveLength(1);
    expect(mockRunExec).toHaveBeenCalledTimes(1);
  });

  it("falls back to next model on failure", async () => {
    const config: OpenClawConfig = {
      tools: {
        links: {
          enabled: true,
          models: [
            { type: "cli", command: "fail", args: [] },
            { type: "cli", command: "succeed", args: [] },
          ],
        },
      },
    };
    const ctx = { ...baseCtx, Body: "https://example.com" };

    // First call fails
    mockRunExec.mockRejectedValueOnce(new Error("Command failed"));
    // Second call succeeds
    mockRunExec.mockResolvedValueOnce({ stdout: "Success", stderr: "" });

    const result = await runLinkUnderstanding({ cfg: config, ctx });

    expect(result.outputs).toEqual(["Success"]);
    expect(mockRunExec).toHaveBeenCalledTimes(2);
    expect(mockRunExec).toHaveBeenNthCalledWith(1, "fail", [], expect.any(Object));
    expect(mockRunExec).toHaveBeenNthCalledWith(2, "succeed", [], expect.any(Object));
  });

  it("skips model if output is empty", async () => {
    const config: OpenClawConfig = {
      tools: {
        links: {
          enabled: true,
          models: [
            { type: "cli", command: "empty", args: [] },
            { type: "cli", command: "succeed", args: [] },
          ],
        },
      },
    };
    const ctx = { ...baseCtx, Body: "https://example.com" };

    // First call returns empty string
    mockRunExec.mockResolvedValueOnce({ stdout: "   ", stderr: "" });
    // Second call succeeds
    mockRunExec.mockResolvedValueOnce({ stdout: "Success", stderr: "" });

    const result = await runLinkUnderstanding({ cfg: config, ctx });

    expect(result.outputs).toEqual(["Success"]);
    expect(mockRunExec).toHaveBeenCalledTimes(2);
  });

  it("applies timeout configuration", async () => {
    const config: OpenClawConfig = {
      tools: {
        links: {
          enabled: true,
          timeoutSeconds: 5,
          models: [
            { type: "cli", command: "echo", args: [] },
          ],
        },
      },
    };
    const ctx = { ...baseCtx, Body: "https://example.com" };

    await runLinkUnderstanding({ cfg: config, ctx });

    expect(mockRunExec).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({ timeoutMs: 5000 })
    );
  });

  it("prefers model-specific timeout over global", async () => {
    const config: OpenClawConfig = {
      tools: {
        links: {
          enabled: true,
          timeoutSeconds: 5,
          models: [
            { type: "cli", command: "echo", args: [], timeoutSeconds: 10 },
          ],
        },
      },
    };
    const ctx = { ...baseCtx, Body: "https://example.com" };

    await runLinkUnderstanding({ cfg: config, ctx });

    expect(mockRunExec).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({ timeoutMs: 10000 })
    );
  });

  it("substitutes template variables in arguments", async () => {
    const config: OpenClawConfig = {
      tools: {
        links: {
          enabled: true,
          models: [
            {
              type: "cli",
              command: "process",
              args: ["--url", "{{LinkUrl}}", "--user", "{{SenderName}}"]
            },
          ],
        },
      },
    };
    const ctx: MsgContext = {
      ...baseCtx,
      Body: "https://example.com",
      SenderName: "Alice"
    };

    await runLinkUnderstanding({ cfg: config, ctx });

    expect(mockRunExec).toHaveBeenCalledWith(
      "process",
      ["--url", "https://example.com", "--user", "Alice"],
      expect.any(Object)
    );
  });
});
