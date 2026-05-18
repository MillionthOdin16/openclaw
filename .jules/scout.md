## 2024-05-24 - Memory Index Manager Pattern
**Defect Pattern:** Hard-dropping SQLite virtual vector tables without re-initializing dimensions during unsafe reindex operations causes subsequent prepared statements on those tables to crash.
**Local Impact:** The `OPENCLAW_TEST_FAST=1` + `OPENCLAW_TEST_MEMORY_UNSAFE_REINDEX=1` paths, or any unsafe/in-place reindexing routines on our local fork, crash out with "no such table: chunks_vec" when sqlite-vec vectors are enabled because the table was dropped but the code immediately tries to execute a row `DELETE` before the first chunk creation re-initialized it.
**Review Strategy:** Any force-reindex or reset operations must check whether tables should be purged by `DELETE FROM` instead of `DROP TABLE` to retain schemas.
