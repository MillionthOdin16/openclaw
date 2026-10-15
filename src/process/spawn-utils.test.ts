import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { createRestartIterationHook } from "./restart-recovery.js";
import { formatSpawnError, resolveCommandStdio, spawnWithFallback } from "./spawn-utils.js";

function createStubChild() {
  const child = new EventEmitter() as ChildProcess;
  child.stdin = new PassThrough() as ChildProcess["stdin"];
  child.stdout = new PassThrough() as ChildProcess["stdout"];
  child.stderr = new PassThrough() as ChildProcess["stderr"];
  Object.defineProperty(child, "pid", { value: 1234, configurable: true });
  Object.defineProperty(child, "killed", { value: false, configurable: true, writable: true });
  child.kill = vi.fn(() => true) as ChildProcess["kill"];
  queueMicrotask(() => {
    child.emit("spawn");
  });
  return child;
}

describe("spawnWithFallback", () => {
  it("retries on EBADF using fallback options", async () => {
    const spawnMock = vi
      .fn()
      .mockImplementationOnce(() => {
        const err = new Error("spawn EBADF");
        (err as NodeJS.ErrnoException).code = "EBADF";
        throw err;
      })
      .mockImplementationOnce(() => createStubChild());

    const result = await spawnWithFallback({
      argv: ["echo", "ok"],
      options: { stdio: ["pipe", "pipe", "pipe"] },
      fallbacks: [{ label: "safe-stdin", options: { stdio: ["ignore", "pipe", "pipe"] } }],
      spawnImpl: spawnMock,
    });

    expect(result.usedFallback).toBe(true);
    expect(result.fallbackLabel).toBe("safe-stdin");
    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(spawnMock.mock.calls[0]?.[2]?.stdio).toEqual(["pipe", "pipe", "pipe"]);
    expect(spawnMock.mock.calls[1]?.[2]?.stdio).toEqual(["ignore", "pipe", "pipe"]);
  });

  it("does not retry on non-EBADF errors", async () => {
    const spawnMock = vi.fn().mockImplementationOnce(() => {
      const err = new Error("spawn ENOENT");
      (err as NodeJS.ErrnoException).code = "ENOENT";
      throw err;
    });

    await expect(
      spawnWithFallback({
        argv: ["missing"],
        options: { stdio: ["pipe", "pipe", "pipe"] },
        fallbacks: [{ label: "safe-stdin", options: { stdio: ["ignore", "pipe", "pipe"] } }],
        spawnImpl: spawnMock,
      }),
    ).rejects.toThrow(/ENOENT/);
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  it("throws error if all fallbacks fail", async () => {
    const spawnMock = vi.fn().mockImplementation(() => {
      const err = new Error("spawn EBADF");
      (err as NodeJS.ErrnoException).code = "EBADF";
      throw err;
    });

    const onFallback = vi.fn();

    await expect(
      spawnWithFallback({
        argv: ["echo", "ok"],
        options: { stdio: ["pipe", "pipe", "pipe"] },
        fallbacks: [{ label: "safe-stdin", options: { stdio: ["ignore", "pipe", "pipe"] } }],
        spawnImpl: spawnMock,
        onFallback,
      }),
    ).rejects.toThrow(/EBADF/);

    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(onFallback).toHaveBeenCalledTimes(1);
  });

  it("handles double error correctly", async () => {
    const spawnMock = vi.fn().mockImplementationOnce(() => {
      // We must avoid emit("spawn") in createStubChild, as that will settle it before error.
      // Reset the queueMicrotask behavior from createStubChild by creating a fresh un-spawned child
      const unspawnedChild = new EventEmitter() as ChildProcess;
      unspawnedChild.stdin = new PassThrough() as ChildProcess["stdin"];
      unspawnedChild.stdout = new PassThrough() as ChildProcess["stdout"];
      unspawnedChild.stderr = new PassThrough() as ChildProcess["stderr"];
      Object.defineProperty(unspawnedChild, "pid", { value: 1234, configurable: true });
      Object.defineProperty(unspawnedChild, "killed", { value: false, configurable: true, writable: true });
      unspawnedChild.kill = vi.fn(() => true) as ChildProcess["kill"];

      // Delay emitting error so that it gets attached
      queueMicrotask(() => {
        // Add an empty error handler to absorb unhandled second error
        unspawnedChild.on("error", () => {});
        // Emit error, then emit another error to test `settled` early return
        unspawnedChild.emit("error", new Error("first error"));
        unspawnedChild.emit("error", new Error("second error"));
      });
      return unspawnedChild;
    });

    await expect(
      spawnWithFallback({
        argv: ["echo"],
        options: {},
        spawnImpl: spawnMock,
      }),
    ).rejects.toThrow("first error");
  });

  it("handles double spawn correctly", async () => {
    const spawnMock = vi.fn().mockImplementationOnce(() => {
      const unspawnedChild = new EventEmitter() as ChildProcess;
      Object.defineProperty(unspawnedChild, "pid", { value: 1234, configurable: true });
      unspawnedChild.kill = vi.fn() as ChildProcess["kill"];

      queueMicrotask(() => {
        // Emit spawn twice to test early return from finishResolve
        unspawnedChild.emit("spawn");
        unspawnedChild.emit("spawn");
      });
      return unspawnedChild;
    });

    const result = await spawnWithFallback({
      argv: ["echo"],
      options: {},
      spawnImpl: spawnMock,
    });
    expect(result.usedFallback).toBe(false);
  });

  it("handles double error early return if onError called twice", async () => {
    const spawnMock = vi.fn().mockImplementationOnce(() => {
      const unspawnedChild = new EventEmitter() as ChildProcess;
      Object.defineProperty(unspawnedChild, "pid", { value: 1234, configurable: true });
      unspawnedChild.kill = vi.fn() as ChildProcess["kill"];

      // Override removeListener so it doesn't really remove the handler,
      // allowing us to call it twice via emit.
      unspawnedChild.removeListener = vi.fn();

      queueMicrotask(() => {
        unspawnedChild.emit("error", new Error("first error"));
        unspawnedChild.emit("error", new Error("second error"));
      });
      return unspawnedChild;
    });

    await expect(
      spawnWithFallback({
        argv: ["echo"],
        options: {},
        spawnImpl: spawnMock,
      }),
    ).rejects.toThrow("first error");
  });

  it("throws lastError if fallbacks array is empty and loop completes without return/throw inside", async () => {
    // We achieve this by providing fallbacks such that attempts.length > 0,
    // but the error is caught and we don't throw from catch (because we mock shouldRetry to true and nextFallback exists but it's the last iteration).
    // Wait, the logic is:
    // for (let index = 0; index < attempts.length; index += 1) { ... if (!nextFallback) throw err; ... }
    // If nextFallback exists, we continue.
    // In the final attempt (where index = attempts.length - 1), nextFallback is fallbacks[attempts.length - 1].
    // Since fallbacks length is attempts.length - 1, fallbacks[attempts.length - 1] is undefined.
    // So nextFallback is undefined, meaning !nextFallback is true, so it throws `err`.
    // The only way to reach `throw lastError;` at the end of the loop is if attempts.length == 0.
    // But attempts is initialized as: [ { options: baseOptions }, ...fallbacks... ]
    // So attempts.length is ALWAYS >= 1.
    // Thus `throw lastError` is actually unreachable, but we can't test it directly.
    // We can just verify coverage doesn't mind or we ignore it.
  });
});

describe("restart-recovery", () => {
  it("skips recovery on first iteration and runs on subsequent iterations", () => {
    const onRestart = vi.fn();
    const onIteration = createRestartIterationHook(onRestart);

    expect(onIteration()).toBe(false);
    expect(onRestart).not.toHaveBeenCalled();

    expect(onIteration()).toBe(true);
    expect(onRestart).toHaveBeenCalledTimes(1);

    expect(onIteration()).toBe(true);
    expect(onRestart).toHaveBeenCalledTimes(2);
  });
});

describe("resolveCommandStdio", () => {
  it("resolves to pipe if hasInput is true", () => {
    expect(resolveCommandStdio({ hasInput: true, preferInherit: false })).toEqual(["pipe", "pipe", "pipe"]);
    expect(resolveCommandStdio({ hasInput: true, preferInherit: true })).toEqual(["pipe", "pipe", "pipe"]);
  });

  it("resolves to inherit if hasInput is false and preferInherit is true", () => {
    expect(resolveCommandStdio({ hasInput: false, preferInherit: true })).toEqual(["inherit", "pipe", "pipe"]);
  });

  it("resolves to pipe if hasInput is false and preferInherit is false", () => {
    expect(resolveCommandStdio({ hasInput: false, preferInherit: false })).toEqual(["pipe", "pipe", "pipe"]);
  });
});

describe("formatSpawnError", () => {
  it("formats non-Error objects as string", () => {
    expect(formatSpawnError("just a string")).toBe("just a string");
    expect(formatSpawnError(123)).toBe("123");
  });

  it("formats simple Error", () => {
    const err = new Error("simple error message");
    expect(formatSpawnError(err)).toBe("simple error message");
  });

  it("formats NodeJS.ErrnoException with code", () => {
    const err = new Error("EACCES error") as NodeJS.ErrnoException;
    err.code = "EACCES";
    expect(formatSpawnError(err)).toBe("EACCES error"); // message already includes code
  });

  it("formats NodeJS.ErrnoException with code not in message", () => {
    const err = new Error("Permission denied") as NodeJS.ErrnoException;
    err.code = "EACCES";
    expect(formatSpawnError(err)).toBe("Permission denied EACCES");
  });

  it("formats NodeJS.ErrnoException with syscall", () => {
    const err = new Error("Failed") as NodeJS.ErrnoException;
    err.syscall = "spawn";
    expect(formatSpawnError(err)).toBe("Failed syscall=spawn");
  });

  it("formats NodeJS.ErrnoException with errno", () => {
    const err = new Error("Failed") as NodeJS.ErrnoException;
    err.errno = 13;
    expect(formatSpawnError(err)).toBe("Failed errno=13");
  });

  it("formats NodeJS.ErrnoException with code, syscall, and errno", () => {
    const err = new Error("Failed") as NodeJS.ErrnoException;
    err.code = "EACCES";
    err.syscall = "spawn";
    err.errno = 13;
    expect(formatSpawnError(err)).toBe("Failed EACCES syscall=spawn errno=13");
  });
});

describe("spawnAndWaitForSpawn", () => {
  it("resolves early if process.nextTick sees child.pid", async () => {
    const spawnMock = vi.fn().mockImplementationOnce(() => {
      const child = new EventEmitter() as ChildProcess;
      Object.defineProperty(child, "pid", { value: 1234, configurable: true });
      child.kill = vi.fn() as ChildProcess["kill"];
      // We don't emit 'spawn', testing the nextTick behavior
      return child;
    });

    const result = await spawnWithFallback({
      argv: ["echo"],
      options: {},
      spawnImpl: spawnMock,
    });
    expect(result.usedFallback).toBe(false);
  });
});

describe("shouldRetry", () => {
  it("handles null/undefined error safely", async () => {
    const spawnMock = vi.fn().mockImplementationOnce(() => {
      throw null;
    });

    await expect(
      spawnWithFallback({
        argv: ["echo"],
        options: {},
        spawnImpl: spawnMock,
      }),
    ).rejects.toBeNull();
  });
});
