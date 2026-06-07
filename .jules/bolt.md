## 2026-06-07 - Prevent Unbounded Memory Load when Reading Session Logs

**Learning:** Reading all JSONL cron run log files into memory and combining them with `.flat()` before filtering causes massive memory spikes and potential OOM crashes when log files become large.
**Action:** Always stream, lazily load, or filter per-file concurrently to drop unmatched entries early and build smaller intermediate arrays when processing multiple log/JSONL files.
