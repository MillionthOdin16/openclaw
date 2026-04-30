## 2024-03-09 - In-place Sorting and Single-pass Iteration

**Learning:** Combining array deduplication and processing into a single loop after an in-place sort (.sort()) is significantly more memory-efficient and performant than creating intermediate arrays (e.g. .toSorted() followed by filtering/pushing).
**Action:** When filtering or deduplicating lists, prefer modifying lists in-place or using a single pass with a Set rather than chaining array methods that create intermediate copies.
