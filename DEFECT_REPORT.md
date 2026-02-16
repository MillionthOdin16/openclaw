# 🦅 Scout: Critical Inherited Defect Report - 2026-02-16

## Summary of Legitimate Bugs

### 1. Upstream Issue #18088: session-memory hook fails to index conversations after /reset
* **Location in our code:** `src/hooks/bundled/session-memory/handler.ts` lines 67-70
* **Expected Behavior:** The `session-memory` hook should trigger when the user issues either `/new` OR `/reset` command, archiving the current session context to a markdown file before the session is cleared.
* **Observed Behavior:** The hook only checks for `event.action === "new"`. If the user runs `/reset` (which also clears the session), the hook exits immediately, resulting in the loss of session context from the memory archive.
* **Impact Severity:** **High**. Users who rely on the memory system for long-term recall will silently lose data if they use `/reset` instead of `/new`. This breaks the core promise of the "Librarian" memory feature for these users.

### 2. Upstream Issue #18101: resolveSessionFilePath called without agent context in runPreparedReply
* **Location in our code:** `src/auto-reply/reply/get-reply-run.ts` line 343
* **Expected Behavior:** `resolveSessionFilePath` should always receive a valid agent context (via `resolveSessionFilePathOptions`) to correctly locate session files for non-default agents.
* **Observed Behavior:** When `runPreparedReply` is called, it may pass an undefined or empty agent ID context in certain flows, causing `resolveSessionFilePath` to fall back to the default agent directory. This breaks session file resolution for non-default agents (e.g., Telegram bots bound to specific agents), leading to errors or inability to find session history.
* **Impact Severity:** **Critical**. Breaks core messaging functionality for any non-default agent configuration on channels like Telegram.

Scan complete. Two high-severity bugs identified.
