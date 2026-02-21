# 🦅 Scout: Critical Inherited Defect Report - 2025-05-23

## Summary of Legitimate Bugs

### 1. Upstream Issue #13938: Session context accumulates infinitely until API limits are exceeded
**Upstream Issue:** https://github.com/openclaw/openclaw/issues/13938
**Local File Path & Line Numbers:**
- `src/agents/pi-embedded-runner/history.ts` (lines 33-40: `limitHistoryTurns` defaults to no limit)
- `src/gateway/session-utils.fs.ts` (lines 67-111: `readSessionMessages` reads entire file)
- `src/agents/pi-embedded-runner/run/attempt.ts` (lines 538-541: `limitHistoryTurns` called with undefined limit by default)

**Observed Behavior:**
- `limitHistoryTurns` defaults to returning all messages if `limit` is undefined or 0.
- `getHistoryLimitFromSessionKey` returns `undefined` if no specific limit is configured in `config.yaml`.
- As a result, the session history grows indefinitely with every turn.
- The system relies on reactive compaction (`runEmbeddedPiAgent` catches context overflow errors), but this fails if the error message doesn't match specific regex patterns or if compaction fails to reduce context sufficiently.
- Users experience `HTTP 400` errors ("input length and max_tokens exceed context limit") and have to manually reset sessions.

**Expected Behavior:**
- Implement a default token-based limit or sliding window for history turns to prevent indefinite growth.
- Proactively truncate history *before* sending the prompt to the model, ensuring it fits within the context window.
- Graceful degradation with user warnings before hitting hard limits.

**Impact Severity:** High (Core functionality break, Usability destroyer)

### 2. Upstream Issue #12776: Context overflow causes repeated LLM rejection errors without graceful handling
**Upstream Issue:** https://github.com/openclaw/openclaw/issues/12776
**Local File Path & Line Numbers:**
- `src/agents/pi-embedded-runner/run.ts` (lines 284-338: reactive compaction logic)
- `src/agents/pi-embedded-helpers/errors.ts` (lines 106-121: `isLikelyContextOverflowError` regex logic)

**Observed Behavior:**
- Compaction is triggered only *after* a model call fails with a specific error message.
- If the error message format changes or doesn't match the regex (`isLikelyContextOverflowError`), compaction is skipped.
- Repeated failures cause spam in the channel as the agent retries without success.

**Expected Behavior:**
- Proactive context management (compaction/truncation) based on token usage tracking, triggered *before* the model call fails.
- Reliable error handling that catches all context overflow scenarios.

**Impact Severity:** High (Usability destroyer)
