## 2025-03-09 - Unbounded Array Creation Memory Bloat

**Learning:** Using `.flat()` on an array of chunks before filtering causes massive intermediate array allocations, risking out-of-memory errors on large files.
**Action:** Filter data chunks concurrently as they are processed, and push only the matched results directly to a shared array.
