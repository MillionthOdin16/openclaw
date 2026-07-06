import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from "vitest";
import { clearActiveProgressLine } from "./terminal/progress-line.js";
import { restoreTerminalState } from "./terminal/restore.js";

vi.mock("./terminal/progress-line.js", () => ({
  clearActiveProgressLine: vi.fn(),
}));

vi.mock("./terminal/restore.js", () => ({
  restoreTerminalState: vi.fn(),
}));

describe("runtime", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITEST", "true");
    vi.stubEnv("OPENCLAW_TEST_RUNTIME_LOG", "");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("defaultRuntime", () => {
    it("log() handles env.VITEST !== 'true'", async () => {
      vi.stubEnv("VITEST", "false");
      const origLog = console.log;
      console.log = function() {} as unknown as typeof console.log; // remove mock object
      const { defaultRuntime } = await import("./runtime.js");
      defaultRuntime.log("test log");
      expect(clearActiveProgressLine).toHaveBeenCalled();
      console.log = origLog;
    });

    it("log() handles env.OPENCLAW_TEST_RUNTIME_LOG === '1'", async () => {
      vi.stubEnv("VITEST", "true");
      vi.stubEnv("OPENCLAW_TEST_RUNTIME_LOG", "1");
      const origLog = console.log;
      console.log = function() {} as unknown as typeof console.log;
      const { defaultRuntime } = await import("./runtime.js");
      defaultRuntime.log("test log");
      expect(clearActiveProgressLine).toHaveBeenCalled();
      console.log = origLog;
    });

    it("log() returns early if in vitest without test runtime log or mock", async () => {
      vi.stubEnv("VITEST", "true");
      vi.stubEnv("OPENCLAW_TEST_RUNTIME_LOG", "");
      const origLog = console.log;
      console.log = function() {} as unknown as typeof console.log;
      const { defaultRuntime } = await import("./runtime.js");
      defaultRuntime.log("test log");
      expect(clearActiveProgressLine).not.toHaveBeenCalled();
      console.log = origLog;
    });

    it("log() proceeds if console.log is mocked", async () => {
      vi.stubEnv("VITEST", "true");
      vi.stubEnv("OPENCLAW_TEST_RUNTIME_LOG", "");
      const { defaultRuntime } = await import("./runtime.js");
      defaultRuntime.log("test log");
      expect(clearActiveProgressLine).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith("test log");
    });

    it("error() calls clearActiveProgressLine and console.error", async () => {
      const { defaultRuntime } = await import("./runtime.js");
      defaultRuntime.error("test error");
      expect(clearActiveProgressLine).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith("test error");
    });

    it("exit() restores terminal state and calls process.exit", async () => {
      const { defaultRuntime } = await import("./runtime.js");
      expect(() => defaultRuntime.exit(1)).toThrow("unreachable");
      expect(restoreTerminalState).toHaveBeenCalledWith("runtime exit", { resumeStdinIfPaused: false });
      expect((process.exit as unknown as Mock).mock.calls[0][0]).toBe(1);
    });
  });

  describe("createNonExitingRuntime", () => {
    it("exit() throws an error instead of calling process.exit", async () => {
      const { createNonExitingRuntime } = await import("./runtime.js");
      const rt = createNonExitingRuntime();
      expect(() => rt.exit(2)).toThrow("exit 2");
      expect((process.exit as unknown as Mock).mock.calls.length).toBe(0);
    });
  });
});
