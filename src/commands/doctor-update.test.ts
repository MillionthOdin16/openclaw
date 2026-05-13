import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { isTruthyEnvValue } from "../infra/env.js";
import { runGatewayUpdate } from "../infra/update-runner.js";
import { runCommandWithTimeout } from "../process/exec.js";
import type { RuntimeEnv } from "../runtime.js";
import { note } from "../terminal/note.js";
import { maybeOfferUpdateBeforeDoctor } from "./doctor-update.js";

vi.mock("../process/exec.js", () => ({
  runCommandWithTimeout: vi.fn(),
}));

vi.mock("../infra/env.js", () => ({
  isTruthyEnvValue: vi.fn(),
}));

vi.mock("../infra/update-runner.js", () => ({
  runGatewayUpdate: vi.fn(),
}));

vi.mock("../terminal/note.js", () => ({
  note: vi.fn(),
}));

vi.mock("../cli/command-format.js", () => ({
  formatCliCommand: vi.fn((cmd) => cmd),
}));

describe("maybeOfferUpdateBeforeDoctor", () => {
  let stdinIsTTYDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
    stdinIsTTYDescriptor = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
    Object.defineProperty(process.stdin, "isTTY", {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    if (stdinIsTTYDescriptor) {
      Object.defineProperty(process.stdin, "isTTY", stdinIsTTYDescriptor);
    } else {
      delete (process.stdin as unknown as Record<string, unknown>).isTTY;
    }
  });

  it("returns { updated: false } if no root is provided", async () => {
    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: {},
      root: null,
      confirm: vi.fn(),
      outro: vi.fn(),
    });
    expect(result).toEqual({ updated: false });
  });

  it("returns { updated: false } if update is in progress", async () => {
    vi.mocked(isTruthyEnvValue).mockReturnValue(true);
    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: {},
      root: "/mock/root",
      confirm: vi.fn(),
      outro: vi.fn(),
    });
    expect(result).toEqual({ updated: false });
  });

  it("returns { updated: false } if nonInteractive is true", async () => {
    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: { nonInteractive: true },
      root: "/mock/root",
      confirm: vi.fn(),
      outro: vi.fn(),
    });
    expect(result).toEqual({ updated: false });
  });

  it("returns { updated: false } if yes is true", async () => {
    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: { yes: true },
      root: "/mock/root",
      confirm: vi.fn(),
      outro: vi.fn(),
    });
    expect(result).toEqual({ updated: false });
  });

  it("returns { updated: false } if repair is true", async () => {
    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: { repair: true },
      root: "/mock/root",
      confirm: vi.fn(),
      outro: vi.fn(),
    });
    expect(result).toEqual({ updated: false });
  });

  it("returns { updated: false } if stdin is not a TTY", async () => {
    Object.defineProperty(process.stdin, "isTTY", {
      value: false,
      configurable: true,
    });
    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: {},
      root: "/mock/root",
      confirm: vi.fn(),
      outro: vi.fn(),
    });
    expect(result).toEqual({ updated: false });
  });

  it("detects not-git when runCommandWithTimeout returns a not a git repository error", async () => {
    vi.mocked(runCommandWithTimeout).mockResolvedValue({
      code: 128,
      stdout: "",
      stderr: "fatal: not a git repository (or any of the parent directories): .git",
    });

    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: {},
      root: "/mock/root",
      confirm: vi.fn(),
      outro: vi.fn(),
    });

    expect(result).toEqual({ updated: false });
    expect(note).toHaveBeenCalledWith(
      expect.stringContaining("This install is not a git checkout."),
      "Update",
    );
  });

  it("detects unknown git status when runCommandWithTimeout throws", async () => {
    vi.mocked(runCommandWithTimeout).mockRejectedValue(new Error("Timeout"));

    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: {},
      root: "/mock/root",
      confirm: vi.fn(),
      outro: vi.fn(),
    });

    expect(result).toEqual({ updated: false });
    expect(note).not.toHaveBeenCalled();
  });

  it("detects unknown git status when runCommandWithTimeout returns non-zero code without 'not a git repository' message", async () => {
    vi.mocked(runCommandWithTimeout).mockResolvedValue({
      code: 1,
      stdout: "",
      stderr: "some other error",
    });

    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: {},
      root: "/mock/root",
      confirm: vi.fn(),
      outro: vi.fn(),
    });

    expect(result).toEqual({ updated: false });
    expect(note).not.toHaveBeenCalled();
  });

  it("detects not-git when rev-parse returns a different root", async () => {
    vi.mocked(runCommandWithTimeout).mockResolvedValue({
      code: 0,
      stdout: "/some/other/root\n",
      stderr: "",
    });

    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: {},
      root: "/mock/root",
      confirm: vi.fn(),
      outro: vi.fn(),
    });

    expect(result).toEqual({ updated: false });
    expect(note).toHaveBeenCalledWith(
      expect.stringContaining("This install is not a git checkout."),
      "Update",
    );
  });

  it("returns { updated: false } if it is a git repo but user declines update", async () => {
    vi.mocked(runCommandWithTimeout).mockResolvedValue({
      code: 0,
      stdout: "/mock/root",
      stderr: "",
    });
    const confirmMock = vi.fn().mockResolvedValue(false);

    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: {},
      root: "/mock/root",
      confirm: confirmMock,
      outro: vi.fn(),
    });

    expect(result).toEqual({ updated: false });
    expect(confirmMock).toHaveBeenCalled();
    expect(runGatewayUpdate).not.toHaveBeenCalled();
  });

  it("returns { updated: true, handled: true } if git update succeeds (status 'ok')", async () => {
    vi.mocked(runCommandWithTimeout).mockResolvedValue({
      code: 0,
      stdout: "/mock/root",
      stderr: "",
    });
    const confirmMock = vi.fn().mockResolvedValue(true);
    vi.mocked(runGatewayUpdate).mockResolvedValue({
      status: "ok",
      mode: "test",
      root: "/mock/root",
      reason: "test update",
    });
    const outroMock = vi.fn();

    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: {},
      root: "/mock/root",
      confirm: confirmMock,
      outro: outroMock,
    });

    expect(result).toEqual({ updated: true, handled: true });
    expect(runGatewayUpdate).toHaveBeenCalledWith({
      cwd: "/mock/root",
      argv1: process.argv[1],
    });
    expect(note).toHaveBeenCalled();
    expect(outroMock).toHaveBeenCalledWith(
      "Update completed (doctor already ran as part of the update).",
    );
  });

  it("returns { updated: true, handled: false } if git update does not return status 'ok'", async () => {
    vi.mocked(runCommandWithTimeout).mockResolvedValue({
      code: 0,
      stdout: "/mock/root",
      stderr: "",
    });
    const confirmMock = vi.fn().mockResolvedValue(true);
    vi.mocked(runGatewayUpdate).mockResolvedValue({
      status: "failed",
      mode: "test",
    } as unknown as RuntimeEnv);
    const outroMock = vi.fn();

    const result = await maybeOfferUpdateBeforeDoctor({
      runtime: {} as unknown as RuntimeEnv,
      options: {},
      root: "/mock/root",
      confirm: confirmMock,
      outro: outroMock,
    });

    expect(result).toEqual({ updated: true, handled: false });
    expect(runGatewayUpdate).toHaveBeenCalledWith({
      cwd: "/mock/root",
      argv1: process.argv[1],
    });
    expect(note).toHaveBeenCalled();
    expect(outroMock).not.toHaveBeenCalled();
  });
});
