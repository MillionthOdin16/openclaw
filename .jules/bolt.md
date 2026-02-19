## 2026-02-16 - Synchronous Filesystem Bottlenecks
**Learning:** `fs.readFileSync` in core utilities like `readLidReverseMapping` can be a significant performance bottleneck (40x slower than cache), especially when called in loops or frequently (e.g., message processing). Negative lookups (scanning multiple directories) are particularly expensive (~2.4ms vs ~0.05ms).
**Action:** Always look for blocking I/O in hot paths. Implement simple in-memory caching (with TTL and bypass for testing/custom options) to eliminate repetitive filesystem access.
