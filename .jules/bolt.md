## 2026-02-21 - Synchronous File I/O in Hot Paths
**Learning:** `readLidReverseMapping` was performing synchronous `fs.readFileSync` calls inside a loop for every message from an unknown LID, causing significant blocking.
**Action:** Always audit utility functions used in message processing loops for synchronous I/O and implement caching (e.g., simple Map with TTL/limit) for static data.
