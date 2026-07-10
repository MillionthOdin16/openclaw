## 2025-07-10 - Replace Array.flat() with Array.flatMap() in large datasets

**Learning:** When parsing large datasets, like in `src/cron/run-log.ts` parsing `.jsonl` files and flattening chunks, `Array.prototype.flat()` followed by filtering creates a potentially very large intermediate array, consuming more memory. A more efficient way that avoids `RangeError` from call stack exhaustion and memory bloat is using `.flatMap()` to efficiently map and filter sub-arrays in one pass.
However, note that simply replacing `.flat()` with `.flatMap((x) => x)` without any mapping or filtering operation is an anti-pattern. Native `Array.prototype.flat()` is heavily optimized in V8/JS engines, while `flatMap((x) => x)` adds the CPU overhead of a callback per item.

**Action:** Whenever mapping chunks and then filtering (or filtering chunks then flattening), use `Array.prototype.flatMap()` to merge them into a single efficient operation. Avoid using `.flatMap((x) => x)` as a general replacement for `.flat()`. Avoid using spread syntax `...elements` combined with large datasets.
