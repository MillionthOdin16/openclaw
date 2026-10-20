import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import {
  estimateUsageCost,
  formatTokenCount,
  formatUsd,
  resolveModelCostConfig,
} from "./usage-format.js";

describe("usage-format", () => {
  describe("formatTokenCount", () => {
    it("formats token counts", () => {
      expect(formatTokenCount(999)).toBe("999");
      expect(formatTokenCount(1234)).toBe("1.2k");
      expect(formatTokenCount(12000)).toBe("12k");
      expect(formatTokenCount(999_499)).toBe("999k");
      expect(formatTokenCount(999_500)).toBe("1.0m");
      expect(formatTokenCount(2_500_000)).toBe("2.5m");
    });

    it("handles undefined or invalid values", () => {
      expect(formatTokenCount(undefined)).toBe("0");
      expect(formatTokenCount(NaN)).toBe("0");
      expect(formatTokenCount(Infinity)).toBe("0");
    });

    it("handles negative values", () => {
      expect(formatTokenCount(-100)).toBe("0");
    });
  });

  describe("formatUsd", () => {
    it("formats USD values", () => {
      expect(formatUsd(1.234)).toBe("$1.23");
      expect(formatUsd(0.5)).toBe("$0.50");
      expect(formatUsd(0.0042)).toBe("$0.0042");
    });

    it("handles undefined or invalid values", () => {
      expect(formatUsd(undefined)).toBe(undefined);
      expect(formatUsd(NaN)).toBe(undefined);
      expect(formatUsd(Infinity)).toBe(undefined);
    });
  });

  describe("resolveModelCostConfig", () => {
    it("resolves model cost config", () => {
      const config = {
        models: {
          providers: {
            test: {
              models: [
                {
                  id: "m1",
                  cost: { input: 1, output: 2, cacheRead: 0.5, cacheWrite: 0 },
                },
              ],
            },
          },
        },
      } as unknown as OpenClawConfig;

      const cost = resolveModelCostConfig({
        provider: "test",
        model: "m1",
        config,
      });

      expect(cost).toEqual({
        input: 1,
        output: 2,
        cacheRead: 0.5,
        cacheWrite: 0,
      });
    });

    it("returns undefined for missing provider or model", () => {
      expect(resolveModelCostConfig({})).toBe(undefined);
      expect(resolveModelCostConfig({ provider: "test" })).toBe(undefined);
      expect(resolveModelCostConfig({ model: "m1" })).toBe(undefined);
    });

    it("returns undefined if config is missing", () => {
      expect(resolveModelCostConfig({ provider: "test", model: "m1" })).toBe(undefined);
    });

    it("returns undefined if provider is not found", () => {
      const config = { models: { providers: {} } } as unknown as OpenClawConfig;
      expect(resolveModelCostConfig({ provider: "test", model: "m1", config })).toBe(undefined);
    });
  });

  describe("estimateUsageCost", () => {
    it("estimates usage cost", () => {
      const cost = { input: 1, output: 2, cacheRead: 0.5, cacheWrite: 0 };
      const total = estimateUsageCost({
        usage: { input: 1000, output: 500, cacheRead: 2000 },
        cost,
      });

      expect(total).toBeCloseTo(0.003);
    });

    it("returns undefined if usage or cost is missing", () => {
      expect(estimateUsageCost({})).toBe(undefined);
      expect(estimateUsageCost({ usage: { input: 100 } })).toBe(undefined);
      expect(estimateUsageCost({ cost: { input: 1, output: 2, cacheRead: 0.5, cacheWrite: 0 } })).toBe(undefined);
    });

    it("handles missing or invalid usage values by treating them as 0", () => {
      const cost = { input: 1, output: 2, cacheRead: 0.5, cacheWrite: 0 };
      const total = estimateUsageCost({
        usage: { input: undefined, output: NaN, cacheRead: Infinity, cacheWrite: 1000 },
        cost,
      });

      expect(total).toBe(0);
    });

    it("returns undefined if result is not finite", () => {
      const cost = { input: Infinity, output: 2, cacheRead: 0.5, cacheWrite: 0 };
      const total = estimateUsageCost({
        usage: { input: 1000 },
        cost,
      });

      expect(total).toBe(undefined);
    });
  });
});
