## 2024-06-26 - [Array flatMap vs flat]

**Learning:** Using `.flat()` on an array of large arrays before filtering causes unnecessary large intermediate array allocations leading to memory bloat. Completely inlining utility functions to avoid this can sacrifice code readability and introduce regressions. `flatMap` avoids massive intermediate bloat while keeping code declarative and reusing utility filters.
**Action:** Use `flatMap` to map and filter sub-arrays efficiently instead of `.flat()` followed by `.filter()`.
