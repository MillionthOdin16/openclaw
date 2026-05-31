## 2026-05-31 - Optimize JSONL parsing to prevent OOM

**Learning:** Reading entire JSONL log files into memory at once and constructing massive intermediate arrays can lead to OOM crashes on large logs.
**Action:** Use concurrent parsing and filtering per file to drop unmatched entries early before building massive intermediate arrays, preventing both OOM and data loss.
