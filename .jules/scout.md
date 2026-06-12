## 2026-06-12 - File IO Pattern

**Defect Pattern:** Unbounded memory load and unbounded file read where entire JSONL log files or session files are loaded into memory at once using `readFileSync` or `readFile`.
**Local Impact:** Causes massive memory usage and OOM crashes during startup or logging in our execution engine.
**Review Strategy:** Check `src/cron/run-log.ts` and `src/config/sessions/store.ts` to ensure files are lazily loaded, paginated, streamed, or parsed concurrently.
