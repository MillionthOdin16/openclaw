## 2026-06-01 - Unbounded File Read Memory Exhaustion

**Learning:** Reading entire JSONL log files into memory at once causes `RangeError: Maximum call stack size exceeded` and out-of-memory crashes for large files.
**Action:** Use concurrent line-by-line parsing (`readline`) with early filtering to drop unmatched entries early, before building massive intermediate arrays, preventing both OOM and data loss.
