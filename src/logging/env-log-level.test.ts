import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveEnvLogLevelOverride } from "./env-log-level.js";
import { loggingState } from "./state.js";

describe("env-log-level", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.OPENCLAW_LOG_LEVEL;
    delete process.env.OPENCLAW_LOG_LEVEL;
    loggingState.invalidEnvLogLevelValue = null;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.OPENCLAW_LOG_LEVEL;
    } else {
      process.env.OPENCLAW_LOG_LEVEL = originalEnv;
    }
    loggingState.invalidEnvLogLevelValue = null;
    vi.restoreAllMocks();
  });

  describe("resolveEnvLogLevelOverride", () => {
    it("returns undefined if OPENCLAW_LOG_LEVEL is not set", () => {
      expect(resolveEnvLogLevelOverride()).toBeUndefined();
    });

    it("returns undefined if OPENCLAW_LOG_LEVEL is empty or whitespace", () => {
      process.env.OPENCLAW_LOG_LEVEL = "";
      expect(resolveEnvLogLevelOverride()).toBeUndefined();

      process.env.OPENCLAW_LOG_LEVEL = "   ";
      expect(resolveEnvLogLevelOverride()).toBeUndefined();
    });

    it("returns parsed level for valid env values", () => {
      process.env.OPENCLAW_LOG_LEVEL = "debug";
      expect(resolveEnvLogLevelOverride()).toBe("debug");

      process.env.OPENCLAW_LOG_LEVEL = "  error  ";
      expect(resolveEnvLogLevelOverride()).toBe("error");
    });

    it("returns undefined for invalid env values and warns to stderr", () => {
      const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(
        () => true as unknown as ReturnType<typeof process.stderr.write>,
      );

      process.env.OPENCLAW_LOG_LEVEL = "invalid-level";

      expect(resolveEnvLogLevelOverride()).toBeUndefined();

      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy.mock.calls[0][0]).toContain('Ignoring invalid OPENCLAW_LOG_LEVEL="invalid-level"');
      expect(loggingState.invalidEnvLogLevelValue).toBe("invalid-level");
    });

    it("warns only once for the same invalid env value", () => {
      const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(
        () => true as unknown as ReturnType<typeof process.stderr.write>,
      );

      process.env.OPENCLAW_LOG_LEVEL = "invalid-level";

      resolveEnvLogLevelOverride();
      resolveEnvLogLevelOverride();
      resolveEnvLogLevelOverride();

      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    it("warns again if the invalid env value changes", () => {
      const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(
        () => true as unknown as ReturnType<typeof process.stderr.write>,
      );

      process.env.OPENCLAW_LOG_LEVEL = "invalid-level-1";
      resolveEnvLogLevelOverride();

      process.env.OPENCLAW_LOG_LEVEL = "invalid-level-2";
      resolveEnvLogLevelOverride();

      expect(stderrSpy).toHaveBeenCalledTimes(2);
      expect(stderrSpy.mock.calls[0][0]).toContain('Ignoring invalid OPENCLAW_LOG_LEVEL="invalid-level-1"');
      expect(stderrSpy.mock.calls[1][0]).toContain('Ignoring invalid OPENCLAW_LOG_LEVEL="invalid-level-2"');
    });

    it("clears invalid state when a valid value is encountered", () => {
      vi.spyOn(process.stderr, "write").mockImplementation(
        () => true as unknown as ReturnType<typeof process.stderr.write>,
      );

      process.env.OPENCLAW_LOG_LEVEL = "invalid-level";
      resolveEnvLogLevelOverride();
      expect(loggingState.invalidEnvLogLevelValue).toBe("invalid-level");

      process.env.OPENCLAW_LOG_LEVEL = "info";
      resolveEnvLogLevelOverride();
      expect(loggingState.invalidEnvLogLevelValue).toBeNull();
    });

    it("clears invalid state when an empty value is encountered", () => {
      vi.spyOn(process.stderr, "write").mockImplementation(
        () => true as unknown as ReturnType<typeof process.stderr.write>,
      );

      process.env.OPENCLAW_LOG_LEVEL = "invalid-level";
      resolveEnvLogLevelOverride();
      expect(loggingState.invalidEnvLogLevelValue).toBe("invalid-level");

      process.env.OPENCLAW_LOG_LEVEL = "";
      resolveEnvLogLevelOverride();
      expect(loggingState.invalidEnvLogLevelValue).toBeNull();
    });
  });
});
