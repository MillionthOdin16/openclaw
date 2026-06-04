## 2026-06-04 - Prevent OOM on Large Cron Log Files

**Learning:** The application was loading entire cron JSONL log files into memory strings and processing them via split/parse, causing `RangeError: Maximum call stack size exceeded` and OOM errors when processing massive datasets, as arrays could grow beyond system limits during parsing before filtering.
**Action:** Use file handles (`fs.open`) and stream parsing (`handle.readLines()`) combined with early filtering to construct smaller target arrays incrementally and prevent massive intermediate string buffers and arrays from loading into process memory at once.
