## 2026-06-12 - Unbounded File Read & Flat

**Learning:** Reading massive numbers of log files into memory and using `.flat()` on all chunks simultaneously creates unbounded intermediate arrays, causing severe OOM issues.
**Action:** Parse and filter entries immediately per-file and append matching items to a shared result array via traditional loops to avoid unbounded memory bloat and call stack limits with spread syntax.
