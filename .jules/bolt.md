## 2026-06-06 - Optimize bulk cron log reading memory usage

**Learning:** Loading all JSONL file contents into a single massive array before filtering can cause unbounded memory growth and OOM crashes for large logs.
**Action:** Always filter data in chunks per-file before concatenating or flattening into large intermediate arrays.
