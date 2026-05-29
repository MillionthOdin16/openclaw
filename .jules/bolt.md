## 2026-05-29 - Unbounded File Reads in Log Parsers
**Learning:** The gateway read entire JSONL log files into massive memory arrays before filtering, occasionally resulting in OOM exhaustion from large log history or 'RangeError: Maximum call stack size exceeded' when chunk arrays were flattened using spread arrays.
**Action:** Always parse log files dynamically with a file stream pipeline and pre-filter during ingestion, building up smaller target arrays explicitly with `push()` instead of array expansion.
