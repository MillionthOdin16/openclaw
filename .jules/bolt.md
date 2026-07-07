## 2023-10-24 - Avoid Memory Bloat from .flat() Before Filtering
**Learning:** Using `.flat()` before filtering large arrays of parsed logs creates massive intermediate arrays that can cause unbounded memory bloat.
**Action:** Instead, use `.flatMap()` to efficiently map and filter sub-arrays, which avoids the memory bloat of `.flat()` while preserving code readability and reusing utility filters.
