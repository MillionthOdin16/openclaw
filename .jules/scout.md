## 2026-05-24 - [cron] Pattern

**Defect Pattern:** Unbounded file reads without memory limits leading to OOM crashes.
**Local Impact:** `readCronRunLogEntriesPage` in `src/cron/run-log.ts` reads the entire JSONL log file into memory before parsing. If the async prune fails, the file grows unbounded, and reading it causes an OOM crash.
**Review Strategy:** Double-check file reading operations, especially `fs.readFile`, to ensure hard size limits or bounded streams are used, and check failure modes of async pruning tasks.
