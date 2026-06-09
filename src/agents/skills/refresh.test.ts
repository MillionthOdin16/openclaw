import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as mod from "./refresh.js";

vi.mock("chokidar", () => {
  return {
    default: {
      watch: vi.fn(() => {
        const listeners: Record<string, Function> = {};
        return {
          on: vi.fn((event: string, cb: Function) => {
            listeners[event] = cb;
            return this;
          }),
          close: vi.fn(async () => undefined),
          _trigger: (event: string, ...args: any[]) => {
            if (listeners[event]) listeners[event](...args);
          },
        };
      }),
    },
  };
});

describe("refresh.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("ensureSkillsWatcher", () => {
    it("ignores node_modules, dist, .git, and Python venvs by default", async () => {
      mod.ensureSkillsWatcher({ workspaceDir: "/tmp/workspace" });

      const chokidar = await import("chokidar");
      const watchMock = chokidar.default.watch as any;
      expect(watchMock).toHaveBeenCalledTimes(1);
      const firstCall = (
        watchMock.mock.calls as unknown as Array<[string[], { ignored?: unknown }]>
      )[0];
      const targets = firstCall?.[0] ?? [];
      const opts = firstCall?.[1] ?? {};

      expect(opts.ignored).toBe(mod.DEFAULT_SKILLS_WATCH_IGNORED);
      const posix = (p: string) => p.replaceAll("\\", "/");
      expect(targets).toEqual(
        expect.arrayContaining([
          posix(path.join("/tmp/workspace", "skills", "SKILL.md")),
          posix(path.join("/tmp/workspace", "skills", "*", "SKILL.md")),
          posix(path.join("/tmp/workspace", ".agents", "skills", "SKILL.md")),
          posix(path.join("/tmp/workspace", ".agents", "skills", "*", "SKILL.md")),
          posix(path.join(os.homedir(), ".agents", "skills", "SKILL.md")),
          posix(path.join(os.homedir(), ".agents", "skills", "*", "SKILL.md")),
        ]),
      );
      expect(targets.every((target) => target.includes("SKILL.md"))).toBe(true);
      const ignored = mod.DEFAULT_SKILLS_WATCH_IGNORED;

      expect(ignored.some((re) => re.test("/tmp/workspace/skills/node_modules/pkg/index.js"))).toBe(
        true,
      );
      expect(ignored.some((re) => re.test("/tmp/workspace/skills/dist/index.js"))).toBe(true);
      expect(ignored.some((re) => re.test("/tmp/workspace/skills/.git/config"))).toBe(true);

      expect(ignored.some((re) => re.test("/tmp/workspace/skills/scripts/.venv/bin/python"))).toBe(
        true,
      );
      expect(
        ignored.some((re) => re.test("/tmp/workspace/skills/venv/lib/python3.10/site.py")),
      ).toBe(true);
      expect(ignored.some((re) => re.test("/tmp/workspace/skills/__pycache__/module.pyc"))).toBe(
        true,
      );
      expect(ignored.some((re) => re.test("/tmp/workspace/skills/.mypy_cache/3.10/foo.json"))).toBe(
        true,
      );
      expect(ignored.some((re) => re.test("/tmp/workspace/skills/.pytest_cache/v/cache"))).toBe(
        true,
      );

      expect(ignored.some((re) => re.test("/tmp/workspace/skills/build/output.js"))).toBe(true);
      expect(ignored.some((re) => re.test("/tmp/workspace/skills/.cache/data.json"))).toBe(true);

      expect(ignored.some((re) => re.test("/tmp/.hidden/skills/index.md"))).toBe(false);
      expect(ignored.some((re) => re.test("/tmp/workspace/skills/my-skill/SKILL.md"))).toBe(false);
    });

    it("returns early if workspaceDir is empty", async () => {
      const chokidar = await import("chokidar");
      const watchMock = chokidar.default.watch as any;
      watchMock.mockClear();
      mod.ensureSkillsWatcher({ workspaceDir: "   " });
      expect(watchMock).not.toHaveBeenCalled();
    });

    it("closes existing watcher if watchEnabled is false", async () => {
      const chokidar = await import("chokidar");
      const watchMock = chokidar.default.watch as any;
      watchMock.mockClear();

      mod.ensureSkillsWatcher({ workspaceDir: "/tmp/workspace1" });
      const firstCall = watchMock.mock.results[0].value;

      mod.ensureSkillsWatcher({
        workspaceDir: "/tmp/workspace1",
        config: { skills: { load: { watch: false } } } as any,
      });
      expect(firstCall.close).toHaveBeenCalledTimes(1);
    });

    it("ignores if identical existing watcher", async () => {
      const chokidar = await import("chokidar");
      const watchMock = chokidar.default.watch as any;
      watchMock.mockClear();

      mod.ensureSkillsWatcher({ workspaceDir: "/tmp/workspace2" });
      mod.ensureSkillsWatcher({ workspaceDir: "/tmp/workspace2" });
      expect(watchMock).toHaveBeenCalledTimes(1); // Second call returns early
    });

    it("recreates watcher if targets change", async () => {
      const chokidar = await import("chokidar");
      const watchMock = chokidar.default.watch as any;
      watchMock.mockClear();

      mod.ensureSkillsWatcher({ workspaceDir: "/tmp/workspace3" });
      const firstCall = watchMock.mock.results[0].value;
      mod.ensureSkillsWatcher({
        workspaceDir: "/tmp/workspace3",
        config: { skills: { load: { extraDirs: ["/extra"] } } } as any,
      });
      expect(firstCall.close).toHaveBeenCalledTimes(1);
      expect(watchMock).toHaveBeenCalledTimes(2);
    });

    it("schedules bump on chokidar events", async () => {
      const chokidar = await import("chokidar");
      const watchMock = chokidar.default.watch as any;
      watchMock.mockClear();

      const listener = vi.fn();
      const unsub = mod.registerSkillsChangeListener(listener);

      mod.ensureSkillsWatcher({
        workspaceDir: "/tmp/workspace4",
        config: { skills: { load: { watchDebounceMs: 100 } } } as any,
      });
      const watcher = watchMock.mock.results[0].value;

      // Simulate "add" event
      watcher._trigger("add", "/tmp/workspace4/skills/new.md");

      expect(listener).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceDir: "/tmp/workspace4",
          reason: "watch",
          changedPath: "/tmp/workspace4/skills/new.md",
        }),
      );

      unsub();
    });

    it("clears old timer on subsequent events", async () => {
      const chokidar = await import("chokidar");
      const watchMock = chokidar.default.watch as any;
      watchMock.mockClear();

      const listener = vi.fn();
      mod.registerSkillsChangeListener(listener);

      mod.ensureSkillsWatcher({
        workspaceDir: "/tmp/workspace5",
        config: { skills: { load: { watchDebounceMs: 100 } } } as any,
      });
      const watcher = watchMock.mock.results[0].value;

      watcher._trigger("change", "/tmp/workspace5/skills/change1.md");
      vi.advanceTimersByTime(50);
      watcher._trigger("unlink", "/tmp/workspace5/skills/change2.md");
      vi.advanceTimersByTime(50);

      expect(listener).not.toHaveBeenCalled();

      vi.advanceTimersByTime(60);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          changedPath: "/tmp/workspace5/skills/change2.md",
        }),
      );
    });

    it("handles error event", async () => {
      const chokidar = await import("chokidar");
      const watchMock = chokidar.default.watch as any;
      watchMock.mockClear();

      mod.ensureSkillsWatcher({ workspaceDir: "/tmp/workspace6" });
      const watcher = watchMock.mock.results[0].value;
      watcher._trigger("error", new Error("test error"));
      // Should not throw, logs internally
    });
  });

  describe("bumpSkillsSnapshotVersion & getSkillsSnapshotVersion", () => {
    it("manages global version correctly", () => {
      const startVersion = mod.getSkillsSnapshotVersion();
      const newVersion = mod.bumpSkillsSnapshotVersion();
      expect(newVersion).toBeGreaterThan(startVersion);
      expect(mod.getSkillsSnapshotVersion()).toBe(newVersion);
    });

    it("manages local version correctly", () => {
      const startGlobal = mod.getSkillsSnapshotVersion();
      const newLocal = mod.bumpSkillsSnapshotVersion({ workspaceDir: "/tmp/local" });
      expect(newLocal).toBeGreaterThan(startGlobal);
      expect(mod.getSkillsSnapshotVersion("/tmp/local")).toBe(newLocal);
    });

    it("emits manual event correctly", () => {
      const listener = vi.fn();
      mod.registerSkillsChangeListener(listener);
      mod.bumpSkillsSnapshotVersion({ reason: "manual" });
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ reason: "manual" }));
    });

    it("handles failing listener gracefully", () => {
      const failingListener = vi.fn(() => {
        throw new Error("Oops");
      });
      const goodListener = vi.fn();

      const unsubFail = mod.registerSkillsChangeListener(failingListener);
      const unsubGood = mod.registerSkillsChangeListener(goodListener);

      mod.bumpSkillsSnapshotVersion();

      expect(failingListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();

      unsubFail();
      unsubGood();
    });
  });
});
