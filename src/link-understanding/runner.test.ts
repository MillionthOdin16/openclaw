import { describe, expect, it, vi, beforeEach } from "vitest";
import { runLinkUnderstanding } from "./runner.js";
import * as execModule from "../process/exec.js";
import * as globalsModule from "../globals.js";
import type { OpenClawConfig } from "../config/types.openclaw.js";
import type { MsgContext } from "../auto-reply/templating.js";

// Mock dependencies
vi.mock("../process/exec.js", () => ({
  runExec: vi.fn(),
}));

vi.mock("../globals.js", () => ({
  logVerbose: vi.fn(),
  shouldLogVerbose: vi.fn().mockReturnValue(false),
}));

describe("runLinkUnderstanding", () => {
  const mockExec = vi.mocked(execModule.runExec);

  const baseContext: MsgContext = {
    Body: "Check this https://example.com",
    SessionKey: "test-session",
    Provider: "test-provider",
    ChatType: "direct",
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
    vi.resetAllMocks();
    mockExec.mockResolvedValue({ stdout: "mock output", stderr: "", exitCode: 0 });
  });

  it("returns empty result if config is missing", async () => {
    const result = await runLinkUnderstanding({
      cfg: {},
      ctx: baseContext,
    });
    expect(result).toEqual({ urls: [], outputs: [] });
  });

  it("returns empty result if tools.links is disabled", async () => {
    const cfg: OpenClawConfig = {
      tools: {
        links: {
          enabled: false,
        },
      },
    };
    const result = await runLinkUnderstanding({
      cfg,
      ctx: baseContext,
    });
    expect(result).toEqual({ urls: [], outputs: [] });
  });

  it("returns empty result if no links in message", async () => {
    const ctx = { ...baseContext, Body: "No links here" };
    const result = await runLinkUnderstanding({
      cfg: baseConfig,
      ctx,
    });
    expect(result).toEqual({ urls: [], outputs: [] });
  });

  it("returns links but no outputs if no models configured", async () => {
    const cfg: OpenClawConfig = {
      tools: {
        links: {
          enabled: true,
          models: [],
        },
      },
    };
    const result = await runLinkUnderstanding({
      cfg,
      ctx: baseContext,
    });
    expect(result.urls).toEqual(["https://example.com"]);
    expect(result.outputs).toEqual([]);
  });

  it("runs configured link model and returns output", async () => {
    mockExec.mockResolvedValueOnce({ stdout: "Processed Link Content", stderr: "", exitCode: 0 });

    const result = await runLinkUnderstanding({
      cfg: baseConfig,
      ctx: baseContext,
    });

    expect(result.urls).toEqual(["https://example.com"]);
    expect(result.outputs).toEqual(["Processed Link Content"]);
    expect(mockExec).toHaveBeenCalledWith(
      "echo",
      ["https://example.com"],
      expect.objectContaining({ maxBuffer: expect.any(Number) })
    );
  });

  it("handles multiple links", async () => {
    const ctx = { ...baseContext, Body: "Links: https://a.com and https://b.com" };
    mockExec
      .mockResolvedValueOnce({ stdout: "Output A", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "Output B", stderr: "", exitCode: 0 });

    const result = await runLinkUnderstanding({
      cfg: baseConfig,
      ctx,
    });

    expect(result.urls).toEqual(["https://a.com", "https://b.com"]);
    expect(result.outputs).toEqual(["Output A", "Output B"]);
    expect(mockExec).toHaveBeenCalledTimes(2);
  });

  it("ignores failed model executions", async () => {
    mockExec.mockRejectedValueOnce(new Error("Command failed"));

    const result = await runLinkUnderstanding({
      cfg: baseConfig,
      ctx: baseContext,
    });

    expect(result.urls).toEqual(["https://example.com"]);
    expect(result.outputs).toEqual([]);
  });

  it("respects maxLinks config", async () => {
    const ctx = { ...baseContext, Body: "https://1.com https://2.com https://3.com" };
    const cfg: OpenClawConfig = {
      tools: {
        links: {
          enabled: true,
          maxLinks: 2,
          models: baseConfig.tools!.links!.models,
        },
      },
    };

    mockExec.mockResolvedValue({ stdout: "ok", stderr: "", exitCode: 0 });

    const result = await runLinkUnderstanding({
      cfg,
      ctx,
    });

    expect(result.urls).toHaveLength(2);
    expect(result.outputs).toHaveLength(2);
    expect(mockExec).toHaveBeenCalledTimes(2);
  });

  it("interpolates args correctly", async () => {
    const cfg: OpenClawConfig = {
      tools: {
        links: {
          enabled: true,
          models: [
            {
              type: "cli",
              command: "curl",
              args: ["-X", "GET", "{{LinkUrl}}"],
            },
          ],
        },
      },
    };

    await runLinkUnderstanding({
      cfg,
      ctx: baseContext,
    });

    expect(mockExec).toHaveBeenCalledWith(
      "curl",
      ["-X", "GET", "https://example.com"],
      expect.any(Object)
    );
  });
});
