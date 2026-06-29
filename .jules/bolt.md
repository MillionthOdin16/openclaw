## 2026-06-29 - Array map flat vs flatMap

**Learning:** When processing large datasets like parsed logs, avoid using `.flat()` before filtering which causes unbounded memory bloat from massive intermediate arrays.
**Action:** Instead, use `.flatMap()` to efficiently map and filter sub-arrays, avoiding the memory bloat of `.flat()` while preserving code readability and reusing utility filters without risky manual inlining.
