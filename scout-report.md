🦅 Scout: Critical Inherited Defect Report - 2026-03-14

**Upstream Issue #45981: Session memory index silently dropped on every gateway restart (shouldSync Sessions priority bug)**
* **Local File Path & Line Numbers:** `src/memory/manager-sync-ops.ts` lines 622-637
* **Observed Behavior:** When a gateway restarts, the `needsFullReindex` is checked after `reason === "session-start" || reason === "watch"`, causing `shouldSyncSessions` to return `false` early. This skips session sync and drops historical session index data.
* **Expected Behavior:** `needsFullReindex` should be checked before the reason-based early return, ensuring full reindex includes sessions on startup or restart.
* **Impact Severity:** High. It silently destroys the session search index on every restart, causing memory_search to lose all historical session context. The agent cannot recall previous conversations.
