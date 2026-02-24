import type { loadConfig } from "../config/config.js";
import {
  resolveAgentMaxConcurrent,
  resolveSubagentMaxConcurrent,
  resolveNestedMaxConcurrent,
} from "../config/agent-limits.js";
import { setCommandLaneConcurrency } from "../process/command-queue.js";
import { CommandLane } from "../process/lanes.js";

export function applyGatewayLaneConcurrency(cfg: ReturnType<typeof loadConfig>) {
  setCommandLaneConcurrency(CommandLane.Cron, cfg.cron?.maxConcurrentRuns ?? 1);
  setCommandLaneConcurrency(CommandLane.Main, resolveAgentMaxConcurrent(cfg));
  setCommandLaneConcurrency(CommandLane.Subagent, resolveSubagentMaxConcurrent(cfg));
  // Apply configurable concurrency to nested lane (sessions_send broadcasts).
  // Prevents cascading timeouts in multi-agent setups. See GitHub issue #14214.
  setCommandLaneConcurrency(CommandLane.Nested, resolveNestedMaxConcurrent(cfg));
}
