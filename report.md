# 🦅 Scout: Critical Inherited Defect Report - 2026-08-16

## 1. Tool Output Context Overflow Failure Loop
* **Upstream Issue:** [#113701](https://github.com/openclaw/openclaw/issues/113701) Context Overflow: large tool outputs exceed context window, compaction can't recover, sessions enter failure loop
* **Location in our code:** `src/agents/pi-embedded-runner/tool-result-context-guard.ts` (lines 144-203) and `src/agents/pi-embedded-runner/run/attempt.ts`
* **Observed Behavior:** When a sub-agent executes multiple tool calls that return medium-sized outputs (e.g., 30-80KB), the individual results bypass single-result truncation thresholds. However, their combined size exceeds the model's total context limit. The context recovery mechanism fails because it does not truncate or compact these results dynamically before the API request, resulting in a continuous input-too-long failure loop and eventual session destruction.
* **Expected Behavior:** Before every model request, the agent's context pipeline should evaluate the total estimated tokens from all queued tool results. If the aggregate length threatens the context budget, the system should dynamically truncate or summarize the most recent oversized tool results to ensure safe execution, preventing the session from entering an unrecoverable failure loop.
* **Impact Severity:** High - Causes complete session stalling, token usage spikes from failed retry attempts, and forces manual reset of multi-step automation loops, leading to data loss for extended workflows.
