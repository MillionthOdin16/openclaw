# 🦅 Scout: Critical Inherited Defect Report - 2026-02-13

## Summary of Legitimate Bugs

**Upstream Issue #15507: Session store lock contention causes /new and /reset to timeout**
* **Location in our code:** `src/config/sessions/store.ts` (Lock logic and 10s timeout)
* **Observed Behavior:** Under heavy load (long context + cron writes), the single `sessions.json` file lock contention causes `/new` and `/reset` commands to time out or appear to do nothing.
* **Expected Behavior:** Session operations should be resilient to lock contention, possibly by using finer-grained locking (per-session) or increasing/retrying timeouts with better user feedback.
* **Impact Severity:** **Critical**. Breaks core user flows (reset/new) and causes perceived bot freezes.

**Upstream Issue #15500: Multi-agent: resolveSessionFilePath missing agentId**
* **Location in our code:** `src/config/sessions/paths.ts` (function `resolveSessionFilePath`)
* **Observed Behavior:** When resolving a session file path for a non-default agent without explicitly passing `agentId`, the system defaults to the main agent's directory. This causes a crash with "Session file path must be within sessions directory" when the path is valid but belongs to another agent.
* **Expected Behavior:** The resolution logic should infer the agent ID from the path or handle absolute paths correctly without enforcing the default agent's root.
* **Impact Severity:** **High**. Breaks multi-agent routing and session management.

**Upstream Issue #15498: QMD: plain INSERT causes UNIQUE constraint crash**
* **Location in our code:** Bundled `qmd` package (referenced in `src/agents/memory-search.ts` context)
* **Observed Behavior:** The vector memory system crashes with `SQLiteError: UNIQUE constraint failed` during updates if a document already exists, causing the gateway boot update to fail silently and new files to be ignored.
* **Expected Behavior:** Document insertion should be idempotent (`INSERT OR REPLACE` or `ON CONFLICT DO UPDATE`) to handle restarts and race conditions gracefully.
* **Impact Severity:** **High**. Causes memory system failure and context loss.

**Upstream Issue #15488: Streaming parser crashes with OpenAI-compatible APIs**
* **Location in our code:** `src/agents/pi-embedded-subscribe/raw-stream.ts` (Suspected parser logic)
* **Observed Behavior:** The streaming parser crashes when OpenAI-compatible APIs (like some local models) omit `choices` in usage-only chunks.
* **Expected Behavior:** The parser should handle optional `choices` fields in streaming chunks gracefully.
* **Impact Severity:** **High**. Breaks compatibility with compliant OpenAI-compatible providers.
