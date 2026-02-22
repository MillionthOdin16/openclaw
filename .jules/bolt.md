## 2024-05-23 - Synchronous Disk I/O in Hot Path
**Learning:** The `readLidReverseMapping` function was performing synchronous `fs.readFileSync` for every message from a LID, causing significant latency.
**Action:** Always check utility functions used in message processing loops for hidden I/O operations and cache them if possible.
