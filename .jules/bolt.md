## 2026-05-27 - Unbounded File Read Pattern in Cron Log
**Learning:** Reading entire JSONL files into memory and splitting by newlines causes OOM crashes for large logs.
**Action:** Use node:fs createReadStream combined with node:readline to parse entries concurrently and avoid massive intermediate memory allocations.
