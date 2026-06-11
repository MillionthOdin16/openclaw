## 2026-06-11 - Prevent Unbounded Memory Bloat in Run Log Queries

**Learning:** Parsing massive datasets across many files into multi-file arrays and using `.flat()` can easily cause unbounded memory bloat and exhaust memory limits (OOM).
**Action:** When filtering across numerous large files, apply filtering functions directly per file chunk during the mapping phase and stream the matching entries into a singular result array, bypassing intermediate bloat.
