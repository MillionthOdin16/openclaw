## 2026-02-16 - [Logger Configuration Bottleneck]
**Learning:** `getLogger()` calls `resolveSettings()` which performs synchronous disk I/O via `fs.readFileSync` (or `require`) to support hot-reloading. In hot paths (e.g. `logVerbose`), this causes massive performance degradation (~0.45ms per call vs ~0.02ms cached).
**Action:** When implementing configuration hot-reloading, always use a TTL (time-to-live) or efficient file watching to prevent checking disk on every access. In this case, a simple 2-second TTL on `getLogger` configuration resolution provided a ~23x speedup.
