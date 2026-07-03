## 2026-07-03 - Avoid .flat() memory bloat on large datasets before filtering

**Learning:** Using `.flat()` on an array of large dataset chunks (like parsed log entries) creates a massive intermediate array, causing unbounded memory bloat and potential OOM errors.
**Action:** When filtering chunks of arrays, use `.flatMap()` to map over the chunks and run the filter logic on each sub-array, which is much more memory efficient than `.flat()` followed by a global filter.
