## 2026-06-13 - Prevent Unbounded Memory Load in Log File Reads

**Learning:** Reading entire massive JSONL log files into memory at once and then combining them into one giant intermediate array with `.flat()` before filtering leads to OOM crashes and massive memory usage.
**Action:** When fixing this, parse and apply filters concurrently per chunk/file to drop unmatched entries early before building massive intermediate arrays.
