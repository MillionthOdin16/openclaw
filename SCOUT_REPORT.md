# 🦅 Scout: Critical Inherited Defect Report - 2026-10-25

## Summary of Legitimate Bugs

### 1. Upstream Issue #26598: Compaction-written providerOverride bypasses fallback chain
*   **Upstream Issue:** https://github.com/openclaw/openclaw/issues/26598
*   **Local File Path:** `src/agents/auth-profiles/session-override.ts`
*   **Observed Behavior:** When auto-compaction runs, the `resolveSessionAuthProfileOverride` function updates the session store to persist auth profile changes. However, it blindly overwrites the existing store entry with the in-memory `sessionEntry` object. If this object contains transient fields (like `providerOverride` set during runtime resolution), these fields are permanently written to `sessions.json`. This hard-locks the session to a specific provider, causing fallback chains to be ignored during rate limits or outages.
*   **Expected Behavior:** The function should perform a partial update, merging only the auth profile fields (`authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`) into the existing store entry, preserving the integrity of the persistent state and ignoring transient in-memory fields.
*   **Impact Severity:** **HIGH**. Causes total agent failure during provider outages even when fallbacks are configured.
*   **Status:** **FIXED** in this PR.

### 2. Upstream Issue #24173: compaction memoryFlush not triggered on gateway restart
*   **Upstream Issue:** https://github.com/openclaw/openclaw/issues/24173
*   **Local File Path:** `src/cli/gateway-cli/run-loop.ts`
*   **Observed Behavior:** The gateway handles `SIGTERM` and `SIGINT` by shutting down the HTTP server, but it does not iterate over active sessions to trigger `memoryFlush`.
*   **Expected Behavior:** On graceful shutdown, the system should identify active sessions with `compaction.memoryFlush.enabled` and trigger a final memory flush (summary generation) to prevent context loss.
*   **Impact Severity:** **HIGH**. Users lose recent session context on every gateway restart or update.
*   **Status:** **VERIFIED**. Requires a separate fix implementing a shutdown hook.

### 3. Upstream Issue #26468: openclaw doctor removes valid session transcript files
*   **Upstream Issue:** https://github.com/openclaw/openclaw/issues/26468
*   **Local File Path:** `src/commands/doctor-state-integrity.ts`
*   **Observed Behavior:** The `doctor` command identifies any `.jsonl` transcript file in the sessions directory that is not referenced by `sessions.json` as an "orphan" and prompts the user to delete/archive it. This includes valid sessions that have simply expired from the active list or been rotated out.
*   **Expected Behavior:** The tool should distinguish between truly corrupt/orphan files and valid historical transcripts that are just no longer active. It should warn about data loss rather than framing it as a cleanup task.
*   **Impact Severity:** **HIGH**. Risk of permanent history loss for users following "maintenance" advice.
*   **Status:** **VERIFIED**. Requires a separate fix to improve orphan detection logic.
