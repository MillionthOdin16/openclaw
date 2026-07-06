## 2025-01-20 - Prevent memory bloat with .flatMap()
**Learning:** Using `.flat()` followed by `.filter()` on arrays containing a massive number of chunks (like parsed log entries) can lead to unbounded memory bloat from intermediate arrays.
**Action:** When filtering chunks, use `.flatMap()` over the outer array so that mapping and filtering applies sequentially, preventing memory bloat while maintaining readable code and reusing utility filters.
