## $(date +%Y-%m-%d) - Stream JSONL cron log files to prevent OOM

**Learning:** The Unbounded File Read defect pattern causes entire JSONL log files to be loaded into memory, parsed, and filtered all at once, leading to severe OOM crashes on heavy instances with large log files.
**Action:** Replace full-file reads and parsing with streaming log parsers using `readline` and `createReadStream` to lazily parse and filter log lines in place, drastically reducing memory footprint.
