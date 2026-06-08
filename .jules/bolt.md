## 2026-06-08 - Unbounded Array Construction during File Read

**Learning:** `chunks.flat()` or spreading large arrays places a huge load on memory. Building massive intermediate arrays from multiple parsed log files before filtering leads to large memory usage and potential OOM errors.
**Action:** When filtering log entries, drop unmatched entries early. By pushing directly to a single result array while iterating over filtered chunks, memory is saved as the entire dataset is not flattened into memory at once before filtering.
