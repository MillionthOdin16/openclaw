# 🦅 Scout: Critical Inherited Defect Report - 2026-08-09

## 1. Unreaped Child Process Leak (Zombie Leak)
* **Upstream Issue:** [#97616](https://github.com/openclaw/openclaw/issues/97616)
* **Local Location:** `src/agents/bash-tools.exec-runtime.ts` (subprocess execution engine spawning child hooks/tools, needs lifecycle validation across `supervisor.spawn`).
* **Expected Behavior:** OpenClaw should reap all completed hook/tool child processes (e.g. bash, codex) promptly after they finish.
* **Observed Behavior:** Hook/tool processes remain as zombies parented under the main OpenClaw process indefinitely, accumulating until they cause `spawn EAGAIN`, `uv_thread_create` failures, and runtime degradation.
* **Impact Severity:** Critical (Causes full gateway lockups, thread exhaustion, and silent feature degradation).

## 2. Gmail Hook Message Drop (Batched Array Ignored)
* **Upstream Issue:** [#120277](https://github.com/openclaw/openclaw/issues/120277)
* **Local Location:** `src/gateway/hooks-mapping.ts` lines 75-77
* **Expected Behavior:** The webhook processor should iterate through all incoming emails within a batched payload (`messages[]`) and dispatch an agent run for each individual message.
* **Observed Behavior:** The built-in preset hardcodes `messages[0]`, successfully processing only the first email while silently dropping all subsequent emails (`messages[1..n]`) in the batch push without warning or error log.
* **Impact Severity:** High (Silent failure / data loss for critical incoming triggers on standard workflows).
