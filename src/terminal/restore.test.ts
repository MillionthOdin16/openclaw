import { afterEach, describe, expect, it, vi } from "vitest";

const clearActiveProgressLine = vi.hoisted(() => vi.fn());

vi.mock("./progress-line.js", () => ({
  clearActiveProgressLine,
}));

import { restoreTerminalState } from "./restore.js";

function configureTerminalIO(params: {
  stdinIsTTY: boolean;
  stdoutIsTTY: boolean;
  setRawMode?: (mode: boolean) => void;
  resume?: () => void;
  isPaused?: () => boolean;
}) {
  Object.defineProperty(process.stdin, "isTTY", { value: params.stdinIsTTY, configurable: true });
  Object.defineProperty(process.stdout, "isTTY", { value: params.stdoutIsTTY, configurable: true });
  (process.stdin as { setRawMode?: (mode: boolean) => void }).setRawMode = params.setRawMode;
  (process.stdin as { resume?: () => void }).resume = params.resume;
  (process.stdin as { isPaused?: () => boolean }).isPaused = params.isPaused;
}

function setupPausedTTYStdin() {
  const setRawMode = vi.fn();
  const resume = vi.fn();
  const isPaused = vi.fn(() => true);
  configureTerminalIO({
    stdinIsTTY: true,
    stdoutIsTTY: false,
    setRawMode,
    resume,
    isPaused,
  });
  return { setRawMode, resume };
}

describe("restoreTerminalState", () => {
  const originalStdinIsTTY = process.stdin.isTTY;
  const originalStdoutIsTTY = process.stdout.isTTY;
  const originalSetRawMode = (process.stdin as { setRawMode?: (mode: boolean) => void }).setRawMode;
  const originalResume = (process.stdin as { resume?: () => void }).resume;
  const originalIsPaused = (process.stdin as { isPaused?: () => boolean }).isPaused;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(process.stdin, "isTTY", {
      value: originalStdinIsTTY,
      configurable: true,
    });
    Object.defineProperty(process.stdout, "isTTY", {
      value: originalStdoutIsTTY,
      configurable: true,
    });
    (process.stdin as { setRawMode?: (mode: boolean) => void }).setRawMode = originalSetRawMode;
    (process.stdin as { resume?: () => void }).resume = originalResume;
    (process.stdin as { isPaused?: () => boolean }).isPaused = originalIsPaused;
  });

  it("does not resume paused stdin by default", () => {
    const { setRawMode, resume } = setupPausedTTYStdin();

    restoreTerminalState("test");

    expect(setRawMode).toHaveBeenCalledWith(false);
    expect(resume).not.toHaveBeenCalled();
  });

  it("resumes paused stdin when resumeStdin is true", () => {
    const { setRawMode, resume } = setupPausedTTYStdin();

    restoreTerminalState("test", { resumeStdinIfPaused: true });

    expect(setRawMode).toHaveBeenCalledWith(false);
    expect(resume).toHaveBeenCalledOnce();
  });

  it("does not touch stdin when stdin is not a TTY", () => {
    const setRawMode = vi.fn();
    const resume = vi.fn();
    const isPaused = vi.fn(() => true);

    configureTerminalIO({
      stdinIsTTY: false,
      stdoutIsTTY: false,
      setRawMode,
      resume,
      isPaused,
    });

    restoreTerminalState("test", { resumeStdinIfPaused: true });

    expect(setRawMode).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
  });

  it("handles progress line errors gracefully", () => {
    const mockStderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    clearActiveProgressLine.mockImplementationOnce(() => {
      throw new Error("progress error");
    });
    restoreTerminalState("test reason");
    expect(mockStderr).toHaveBeenCalledWith(
      expect.stringContaining("[terminal] restore progress line failed (test reason): Error: progress error\n")
    );
  });

  it("handles raw mode errors gracefully", () => {
    const mockStderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const setRawMode = vi.fn(() => {
      throw new Error("raw mode error");
    });
    configureTerminalIO({
      stdinIsTTY: true,
      stdoutIsTTY: false,
      setRawMode,
      isPaused: vi.fn(() => false),
    });
    restoreTerminalState();
    expect(mockStderr).toHaveBeenCalledWith(
      expect.stringContaining("[terminal] restore raw mode failed: Error: raw mode error\n")
    );
  });

  it("handles stdin resume errors gracefully", () => {
    const mockStderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const resume = vi.fn(() => {
      throw new Error("resume error");
    });
    configureTerminalIO({
      stdinIsTTY: true,
      stdoutIsTTY: false,
      setRawMode: vi.fn(),
      resume,
      isPaused: vi.fn(() => true),
    });
    restoreTerminalState(undefined, { resumeStdin: true });
    expect(mockStderr).toHaveBeenCalledWith(
      expect.stringContaining("[terminal] restore stdin resume failed: Error: resume error\n")
    );
  });

  it("writes reset sequence and handles stdout reset errors gracefully", () => {
    const mockStdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    configureTerminalIO({
      stdinIsTTY: false,
      stdoutIsTTY: true,
    });
    restoreTerminalState();
    expect(mockStdout).toHaveBeenCalled();

    const mockStderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    mockStdout.mockImplementation(() => {
      throw new Error("stdout error");
    });
    restoreTerminalState();
    expect(mockStderr).toHaveBeenCalledWith(
      expect.stringContaining("[terminal] restore stdout reset failed: Error: stdout error\n")
    );
  });

  it("falls back to console.error if process.stderr.write throws", () => {
    const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(process.stderr, "write").mockImplementation(() => {
      throw new Error("stderr error");
    });
    clearActiveProgressLine.mockImplementationOnce(() => {
      throw new Error("progress error");
    });
    restoreTerminalState("test");
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("[terminal] restore reporting failed (test): Error: stderr error")
    );
  });
});
