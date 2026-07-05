## 2024-07-05 - Avoid .flat() before filter on massive arrays
**Learning:** Calling `.flat()` on an array of chunks before `.filter()` causes unbounded memory bloat by creating a massive intermediate array. This can exhaust heap limits when processing large log datasets.
**Action:** Use `.flatMap()` to map and filter sub-arrays directly. This efficiently processes the data while avoiding memory bloat and preserving the reuse of utility filters.
