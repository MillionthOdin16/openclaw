## 2026-06-20 - Session Store Pattern

**Defect Pattern:** Unbounded Memory Load
**Local Impact:** The gateway accumulates all session entries (including ephemeral subagent and cron sessions) and loads them entirely into memory at startup using `fs.readFileSync` in `src/config/sessions/store.ts`. Each session duplicates the `skillsSnapshot`, leading to massive memory bloat (~50-100 MB/min) and eventual OOM crashes.
**Review Strategy:** Check `src/config/sessions/store.ts` and other file I/O operations for `readFileSync` usage on unbounded collections. Ensure lazy loading, pagination, or streaming is implemented for large JSON files.
