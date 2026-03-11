## 2024-05-24 - Node.js Serialization Hot-Path Optimization
**Learning:** In hot-path serialization loops or core utility functions (such as `stableStringify`), using intermediate array allocations and `.map().join()` has a significant overhead.
**Action:** Prefer manual iteration (`for` loops) and standard string concatenation (`+=`) over array methods (`.map().join()`) or intermediate object allocation to significantly improve performance.
