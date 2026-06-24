## 2026-06-24 - Unbounded Memory Load Pattern

**Learning:** `src/cron/run-log.ts` parses massive JSONL run log datasets and aggregates them with `.flat()` before filtering. This creates unbound intermediate arrays, crashing the process or exhausting memory.
**Action:** When reading unbounded datasets like log files from disk, avoid `.flat()` and `push(...elements)`. Instead, map over chunks, filter them concurrently, and push the matched entries directly into a single results array sequentially.
