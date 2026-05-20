## 2025-02-20 - Memory Index Manager Pattern
**Defect Pattern:** SQLite virtual vector tables (e.g., sqlite-vec) are hard-dropped during unsafe reindex operations without re-initializing dimensions, causing subsequent prepared statements that reference these tables to crash with 'no such table'.
**Local Impact:** `runUnsafeReindex` calls `resetIndex` which hard-drops the vector table, leading to a crash because the vector table is never explicitly re-initialized (no `ensureSchema` call).
**Review Strategy:** Check force-reindex operations to ensure they purge rows via `DELETE FROM` rather than dropping the table entirely, or ensure `ensureSchema` is invoked afterwards.
