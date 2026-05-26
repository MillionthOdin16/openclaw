## 2024-05-15 - Unbounded File Read Pattern

**Learning:** The OpenClaw project exhibits an 'Unbounded File Read' defect pattern where entire JSONL log files are read into memory at once without size caps, leading to OOM crashes if asynchronous pruning fails. Bounded streams or hard read limits must be used.
**Action:** When reading unbounded files, such as log files, cap the read size (e.g., using `fs.open` and bounded buffers) to prevent OOM errors.
