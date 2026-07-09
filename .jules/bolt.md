## 2024-05-18 - Avoid array `.flat()` memory bloat
**Learning:** In V8, using `arr.push(...elements)` causes `RangeError` from call stack exhaustion for large datasets. Additionally, calling `.flat()` before filtering causes unbounded memory bloat from massive intermediate arrays.
**Action:** Use `.flatMap()` instead to map and flat concurrently. When filtering is involved, use `.flatMap()` to efficiently map and filter sub-arrays in one pass, avoiding the memory bloat of `.flat()` while preserving code readability and reusing utility filters without risky manual inlining.
