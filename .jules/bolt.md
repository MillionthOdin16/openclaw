## 2026-06-02 - Unbounded File Read Pattern

**Learning:** Found an "Unbounded File Read" defect pattern (e.g., in `src/cron/run-log.ts`) where reading entire JSONL log files into memory at once leads to OOM crashes. When fixing this, avoid arbitrary hard read limits that truncate data; instead, use concurrent parsing and filtering per file to drop unmatched entries early before building massive intermediate arrays, preventing both OOM and data loss.
**Action:** Applied a filtering function to `parseAllRunLogEntries` to immediately filter out entries that don't match the query parameters during parsing. This prevents intermediate arrays of unbounded size when reading massive cron logs.
