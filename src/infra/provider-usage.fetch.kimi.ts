import type { ProviderUsageSnapshot, UsageWindow } from "./provider-usage.types.js";
import { logDebug } from "../logger.js";
import { fetchJson } from "./provider-usage.fetch.shared.js";
import { clampPercent, PROVIDER_LABELS } from "./provider-usage.shared.js";

type KimiUsageResponse = {
  usage?: {
    used?: number;
    limit?: number;
    resetTime?: string;
  };
  limits?: Array<{
    detail?: {
      used?: number;
      limit?: number;
      resetTime?: string;
    };
  }>;
};

const BASE_URL = "https://api.kimi.com/coding/v1";

function parseResetTime(resetTime: string | undefined): number | undefined {
  if (!resetTime?.trim()) {
    return undefined;
  }
  try {
    const parsed = Date.parse(resetTime);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function extractWeeklyWindow(data: KimiUsageResponse): UsageWindow | null {
  const usage = data.usage;
  if (!usage) {
    return null;
  }

  const used = parseNumber(usage.used) ?? 0;
  const limitValue = parseNumber(usage.limit);
  const limit = typeof limitValue === "number" && limitValue > 0 ? limitValue : 100;
  const usedPercent = clampPercent((used / limit) * 100);

  return {
    label: "Weekly",
    usedPercent,
    resetAt: parseResetTime(usage.resetTime),
  };
}

function extractWindowLimit(data: KimiUsageResponse): UsageWindow | null {
  const detail = data.limits?.[0]?.detail;
  if (!detail) {
    return null;
  }

  const used = parseNumber(detail.used) ?? 0;
  const limitValue = parseNumber(detail.limit);
  const limit = typeof limitValue === "number" && limitValue > 0 ? limitValue : 100;
  const usedPercent = clampPercent((used / limit) * 100);

  return {
    label: "5h",
    usedPercent,
    resetAt: parseResetTime(detail.resetTime),
  };
}

export async function fetchKimiUsage(
  apiKey: string,
  timeoutMs: number,
  fetchFn: typeof fetch,
): Promise<ProviderUsageSnapshot> {
  logDebug("[kimi] Fetching usage data");

  const res = await fetchJson(
    `${BASE_URL}/usages`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "KimiCLI/0.77",
      },
    },
    timeoutMs,
    fetchFn,
  );

  if (!res.ok) {
    const error = res.status === 401 ? "Token expired" : `HTTP ${res.status}`;
    logDebug(`[kimi] Fetch failed: ${error}`);
    return {
      provider: "kimi-code",
      displayName: PROVIDER_LABELS["kimi-code"],
      windows: [],
      error,
    };
  }

  const data = (await res.json().catch(() => null)) as KimiUsageResponse | null;
  if (!data || typeof data !== "object") {
    logDebug("[kimi] Invalid JSON response");
    return {
      provider: "kimi-code",
      displayName: PROVIDER_LABELS["kimi-code"],
      windows: [],
      error: "Invalid JSON",
    };
  }

  const windows: UsageWindow[] = [];

  // Extract weekly quota
  const weeklyWindow = extractWeeklyWindow(data);
  if (weeklyWindow) {
    windows.push(weeklyWindow);
    logDebug(`[kimi] Weekly: ${weeklyWindow.usedPercent.toFixed(1)}% used`);
  }

  // Extract 5-hour window limit
  const windowLimit = extractWindowLimit(data);
  if (windowLimit) {
    windows.push(windowLimit);
    logDebug(`[kimi] 5h window: ${windowLimit.usedPercent.toFixed(1)}% used`);
  }

  if (windows.length === 0) {
    logDebug("[kimi] No usage data found in response");
    return {
      provider: "kimi-code",
      displayName: PROVIDER_LABELS["kimi-code"],
      windows: [],
      error: "No usage data available",
    };
  }

  logDebug(`[kimi] Returning snapshot with ${windows.length} windows`);

  return {
    provider: "kimi-code",
    displayName: PROVIDER_LABELS["kimi-code"],
    windows,
  };
}
