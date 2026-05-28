## 2026-05-28 - Unbounded File Read Memory Exhaustion

**Learning:** Reading entire JSONL log files into memory and storing all parsed objects in massive arrays leads to OOM crashes on the backend, especially under high concurrency or for large files.
**Action:** Use concurrent inline parsing and filtering per file. Drop unmatched entries immediately during the parse loop before accumulating massive intermediate arrays.
