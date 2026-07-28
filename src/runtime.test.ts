import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted to ensure the mocks are set up before the modules under test are imported.
const { clearActiveProgressLineMock, restoreTerminalStateMock } = vi.hoisted(() => ({
  clearActiveProgressLineMock: vi.fn(),
  restoreTerminalStateMock: vi.fn(),
}));

vi.mock("./terminal/progress-line.js", () => {
  return {
    clearActiveProgressLine: (...args: unknown[]) => clearActiveProgressLineMock(...args),
  };
});

vi.mock("./terminal/restore.js", () => {
  return {
    restoreTerminalState: (...args: unknown[]) => restoreTerminalStateMock(...args),
  };
});

// Since the `runtime.ts` file evaluates `createRuntimeIo` at import time for `defaultRuntime`,
// we need to dynamically import it inside each test to pick up env changes for `defaultRuntime` initialization,
// or we can test `createNonExitingRuntime` directly which evaluates it on call.

describe("runtime", () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let originalProcessExit: typeof process.exit;

  beforeEach(() => {
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalProcessExit = process.exit;

    clearActiveProgressLineMock.mockClear();
    restoreTerminalStateMock.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  describe("createRuntimeIo (via createNonExitingRuntime)", () => {
    describe("log", () => {
      it("should emit log and clear progress line when mocked", async () => {
        const customLogSpy = vi.fn();
        vi.spyOn(console, "log").mockImplementation(customLogSpy);

        vi.stubEnv("VITEST", "false");

        const { createNonExitingRuntime } = await import("./runtime.js");
        const runtime = createNonExitingRuntime();
        runtime.log("test", "message");
        expect(clearActiveProgressLineMock).toHaveBeenCalled();
        expect(customLogSpy).toHaveBeenCalledWith("test", "message");
      });

      it("should emit log when VITEST is not true", async () => {
        let calledWith: unknown[] | null = null;
        console.log = function(...args: unknown[]) { calledWith = args; } as unknown as typeof console.log;

        vi.stubEnv("VITEST", "false");

        const { createNonExitingRuntime } = await import("./runtime.js");
        const runtime = createNonExitingRuntime();
        runtime.log("test");
        expect(clearActiveProgressLineMock).toHaveBeenCalled();
        expect(calledWith).toEqual(["test"]);
      });

      it("should emit log when OPENCLAW_TEST_RUNTIME_LOG is 1", async () => {
        let calledWith: unknown[] | null = null;
        console.log = function(...args: unknown[]) { calledWith = args; } as unknown as typeof console.log;

        vi.stubEnv("VITEST", "true");
        vi.stubEnv("OPENCLAW_TEST_RUNTIME_LOG", "1");

        const { createNonExitingRuntime } = await import("./runtime.js");
        const runtime = createNonExitingRuntime();
        runtime.log("test");
        expect(clearActiveProgressLineMock).toHaveBeenCalled();
        expect(calledWith).toEqual(["test"]);
      });

      it("should emit log when console.log has mock property", async () => {
        let calledWith: unknown[] | null = null;
        console.log = function(...args: unknown[]) { calledWith = args; } as unknown as typeof console.log;
        (console.log as unknown as { mock: unknown }).mock = {};

        vi.stubEnv("VITEST", "true");
        // Ensure OPENCLAW_TEST_RUNTIME_LOG is not set so it falls through to checking mock
        delete process.env.OPENCLAW_TEST_RUNTIME_LOG;

        const { createNonExitingRuntime } = await import("./runtime.js");
        const runtime = createNonExitingRuntime();
        runtime.log("test");
        expect(clearActiveProgressLineMock).toHaveBeenCalled();
        expect(calledWith).toEqual(["test"]);
      });

      it("should not emit log when conditions are not met", async () => {
        let calledWith: unknown[] | null = null;
        console.log = function(...args: unknown[]) { calledWith = args; } as unknown as typeof console.log;

        vi.stubEnv("VITEST", "true");
        delete process.env.OPENCLAW_TEST_RUNTIME_LOG;

        const { createNonExitingRuntime } = await import("./runtime.js");
        const runtime = createNonExitingRuntime();
        runtime.log("test");
        expect(clearActiveProgressLineMock).not.toHaveBeenCalled();
        expect(calledWith).toBeNull();
      });
    });

    describe("error", () => {
      it("should emit error and clear progress line", async () => {
        let calledWith: unknown[] | null = null;
        console.error = function(...args: unknown[]) { calledWith = args; } as unknown as typeof console.error;

        const { createNonExitingRuntime } = await import("./runtime.js");
        const runtime = createNonExitingRuntime();
        runtime.error("error", "message");
        expect(clearActiveProgressLineMock).toHaveBeenCalled();
        expect(calledWith).toEqual(["error", "message"]);
      });
    });
  });

  describe("defaultRuntime", () => {
    it("exit should restore terminal state and call process.exit", async () => {
      let exitCalledWith: unknown = null;
      process.exit = function(code?: number) {
        exitCalledWith = code;
        throw new Error("unreachable");
      } as unknown as typeof process.exit;

      const { defaultRuntime } = await import("./runtime.js");
      expect(() => defaultRuntime.exit(1)).toThrow("unreachable");
      expect(restoreTerminalStateMock).toHaveBeenCalledWith("runtime exit", {
        resumeStdinIfPaused: false,
      });
      expect(exitCalledWith).toBe(1);
    });
  });

  describe("createNonExitingRuntime", () => {
    it("exit should throw error with code", async () => {
      let exitCalled = false;
      process.exit = function() { exitCalled = true; } as unknown as typeof process.exit;

      const { createNonExitingRuntime } = await import("./runtime.js");
      const runtime = createNonExitingRuntime();
      expect(() => runtime.exit(42)).toThrow("exit 42");
      expect(exitCalled).toBe(false);
    });
  });
});
