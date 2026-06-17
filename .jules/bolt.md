## 2026-06-17 - Unbounded Memory Load when processing cron run logs

**Learning:** In `readCronRunLogEntriesPageAll` (and similar log reading functions), using `.flat()` on an array of chunks followed by `.filter()` creates a massive intermediate array in memory, causing bounded memory bloat which can lead to Out Of Memory (OOM) errors. Also, `arr.push(...elements)` can cause `RangeError: Maximum call stack size exceeded` if `elements` is large.
**Action:** Instead of `chunks.flat().filter(...)` or `push(...)`, iterate through chunks and filter concurrently, pushing matching entries directly to a single result array.
