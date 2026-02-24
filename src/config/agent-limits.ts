import type { OpenClawConfig } from "./types.js";

export const DEFAULT_AGENT_MAX_CONCURRENT = 4;
export const DEFAULT_SUBAGENT_MAX_CONCURRENT = 8;
export const DEFAULT_NESTED_MAX_CONCURRENT = 4;

export function resolveAgentMaxConcurrent(cfg?: OpenClawConfig): number {
  const raw = cfg?.agents?.defaults?.maxConcurrent;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(1, Math.floor(raw));
  }
  return DEFAULT_AGENT_MAX_CONCURRENT;
}

export function resolveSubagentMaxConcurrent(cfg?: OpenClawConfig): number {
  const raw = cfg?.agents?.defaults?.subagents?.maxConcurrent;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(1, Math.floor(raw));
  }
  return DEFAULT_SUBAGENT_MAX_CONCURRENT;
}

/**
 * Resolve the max concurrent setting for the nested lane (sessions_send broadcasts).
 * Defaults to 4 to prevent cascading timeouts in multi-agent setups.
 * See GitHub issue #14214.
 */
export function resolveNestedMaxConcurrent(cfg?: OpenClawConfig): number {
  // Support both nestedMaxConcurrent and sessions.maxConcurrent for flexibility
  const raw =
    cfg?.agents?.defaults?.nestedMaxConcurrent ?? cfg?.agents?.defaults?.sessions?.maxConcurrent;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(1, Math.floor(raw));
  }
  return DEFAULT_NESTED_MAX_CONCURRENT;
}
