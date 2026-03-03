## 2024-05-24 - readLidReverseMapping bottleneck
**Learning:** `fs.readFileSync` calls on repeated lookups blocks the process and causes performance bottlenecks.
**Action:** Always implement a bounded in-memory `Map` cache with a TTL to prevent blocking synchronous file system read calls for repeated lookups, including negative caching (storing `null`) to prevent disk access on missing files.
