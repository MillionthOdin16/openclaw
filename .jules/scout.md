## 2026-06-02 - [Cron] Pattern

**Defect Pattern:** Unbounded file read.
**Local Impact:** `readCronRunLogEntriesPage` reads entire JSONL files into memory at once, which can lead to OOM crashes.
**Review Strategy:** Check `src/cron/run-log.ts` to avoid unbounded memory loading.

## 2026-06-02 - [Memory Index Manager] Pattern

**Defect Pattern:** Hard-drop of sqlite-vec virtual table.
**Local Impact:** `resetIndex` drops the table instead of deleting rows, causing subsequent prepared statements that reference these tables to crash with 'no such table: chunks_vec'.
**Review Strategy:** Check `src/memory/manager-sync-ops.ts` to ensure we purge rows via `DELETE FROM` rather than dropping the table entirely.

## 2026-06-02 - [Sessions] Pattern

**Defect Pattern:** Unbounded memory load on gateway start.
**Local Impact:** `sessions.json` and all JSONL session files are loaded into memory via `readFileSync`, causing massive memory usage and potential OOM.
**Review Strategy:** Check `src/config/sessions/store.ts` and related session loading files.
