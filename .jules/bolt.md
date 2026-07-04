## 2024-05-24 - Avoiding memory bloat from .flat() on large datasets
**Learning:** When processing large datasets like parsed logs, using `.flat()` before filtering creates a massive intermediate array, causing unbounded memory bloat and potential crashes.
**Action:** Use `.flatMap()` to efficiently map and filter sub-arrays simultaneously, avoiding memory bloat while preserving readability.
