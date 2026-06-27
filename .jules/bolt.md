## 2026-06-27 - Array Flattening Memory Bloat

**Learning:** Using `.flat()` on an array of arrays before filtering creates a massive intermediate array in memory, which can lead to excessive memory bloat and potential `RangeError` from call stack exhaustion if spread syntax was used.
**Action:** Use `.flatMap()` to efficiently map and filter sub-arrays in a single pass, avoiding the memory bloat of `.flat()` while preserving code readability and reusing utility filters without risky manual inlining.
