## 2025-02-15 - Optimize array flat() to flatMap()

**Learning:** Using `.flat()` on an array of large subsets creates unbounded memory bloat from massive intermediate arrays, especially in backend data processors (like log readers).
**Action:** Use `.flatMap()` to efficiently map and filter sub-arrays on the fly instead of chaining `.flat()` followed by `.filter()`.
