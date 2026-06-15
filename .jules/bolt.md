## 2026-06-15 - Unbounded Array Flat Pattern

**Learning:** Parsing large JSONL files concurrently into separate arrays and using `.flat()` on them creates a massive intermediate array in memory before filtering, which can lead to excessive memory bloat or OOM errors for large log datasets.
**Action:** When mapping over files to read and parse data, filter the parsed data immediately within each concurrent chunk and push the matching entries directly to a shared array using a loop. This avoids the intermediate `.flat()` call and bounds the memory strictly to only the filtered results.
