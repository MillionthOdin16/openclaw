## 2024-05-24 - Array method chaining overhead
**Learning:** Found that chaining `.map().filter()` over large arrays of strings creates an intermediate array allocation that adds significant overhead when parsing large text chunks (like log files). Combining them into a single loop provides up to a ~50% speedup in V8 for these parsing scenarios.
**Action:** Replace `array.map(transform).filter(condition)` with a single `for...of` loop or `Array.prototype.reduce` when processing text buffers or log files where the array can grow large.
