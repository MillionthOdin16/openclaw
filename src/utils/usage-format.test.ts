import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import {
  estimateUsageCost,
  formatTokenCount,
  formatUsd,
  resolveModelCostConfig,
} from "./usage-format.js";

describe("usage-format", () => {
  it("formats token counts", () => {
    expect(formatTokenCount(999)).toBe("999");
    expect(formatTokenCount(1234)).toBe("1.2k");
    expect(formatTokenCount(12000)).toBe("12k");
    expect(formatTokenCount(999_499)).toBe("999k");
    expect(formatTokenCount(999_500)).toBe("1.0m");
    expect(formatTokenCount(2_500_000)).toBe("2.5m");

    // Edge cases
    expect(formatTokenCount(undefined)).toBe("0");
    expect(formatTokenCount(NaN)).toBe("0");
    expect(formatTokenCount(Infinity)).toBe("0");
  });

  it("formats USD values", () => {
    expect(formatUsd(1.234)).toBe("$1.23");
    expect(formatUsd(0.5)).toBe("$0.50");
    expect(formatUsd(0.0042)).toBe("$0.0042");

    // Edge cases
    expect(formatUsd(undefined)).toBeUndefined();
    expect(formatUsd(NaN)).toBeUndefined();
    expect(formatUsd(Infinity)).toBeUndefined();
  });

  it("resolves model cost config and estimates usage cost", () => {
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

    // Edge cases for resolveModelCostConfig
    expect(resolveModelCostConfig({ provider: undefined, model: "m1", config })).toBeUndefined();
    expect(resolveModelCostConfig({ provider: "test", model: undefined, config })).toBeUndefined();

    const total = estimateUsageCost({
      usage: { input: 1000, output: 500, cacheRead: 2000 },
      cost,
    });

    expect(total).toBeCloseTo(0.003);

    // Edge cases for estimateUsageCost
    expect(estimateUsageCost({ usage: undefined, cost })).toBeUndefined();
    expect(estimateUsageCost({ usage: { input: 1000, output: 500, cacheRead: 2000 }, cost: undefined })).toBeUndefined();

    // Testing non-finite total edge case
    expect(
      estimateUsageCost({
        usage: { input: 1000 },
        cost: { ...cost, input: Infinity },
      })
    ).toBeUndefined();

    // Testing missing providers edge case
    expect(
      resolveModelCostConfig({
        provider: "test",
        model: "m1",
        config: {} as unknown as OpenClawConfig,
      })
    ).toBeUndefined();
  });
});