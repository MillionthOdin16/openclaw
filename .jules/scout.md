## 2026-06-01 - Memory Index Manager Pattern

**Defect Pattern:** SQLite virtual vector tables (e.g., sqlite-vec) are hard-dropped during unsafe reindex operations without re-initializing dimensions, causing subsequent prepared statements that reference these tables to crash with 'no such table'.
**Local Impact:** Windows local deployments or fast test paths utilizing in-place (`runUnsafeReindex`) reindexing crash immediately if vectors are enabled, leaving users with no working force-reindex path.
**Review Strategy:** Check force-reindex operations (like `resetIndex`) to ensure they purge rows via `DELETE FROM` rather than dropping the virtual vector table entirely.
