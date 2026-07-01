## 2025-03-08 - Use flatMap to avoid memory bloat

**Learning:** In `src/cron/run-log.ts` and `src/gateway/server-methods/usage.ts`, using `.flat()` on an array of parsed log records before filtering causes unbounded memory bloat from massive intermediate arrays. It also crashes with `RangeError` if spread syntax is used elsewhere on these chunks.
**Action:** Replace `chunks.flat()` followed by `.filter(...)` with `.flatMap(chunk => chunk.filter(...))` or just `.flatMap(...)` combined with filtering logically to avoid allocating a huge intermediate array for massive data sets.
