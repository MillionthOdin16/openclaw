## $(date +%Y-%m-%d) - Unbounded Array Growth in Log Parsing
**Learning:** In `src/cron/run-log.ts`, building a massive flat array in memory by parsing entire log files string-by-string before applying filters causes severe memory ballooning (>1.2GB) and OOM crashes for high-frequency logs.
**Action:** When parsing unbounded logs or histories (like JSONL files), always utilize `node:readline` and `createReadStream` to parse and filter line-by-line, discarding non-matching entries immediately rather than accumulating everything in memory first.
