## 2024-07-02 - Memory Bloat with .flat()

**Learning:** Using `.flat()` on an array of arrays can cause memory bloat by allocating large intermediate array instances, particularly when followed by a `.filter()` operation on the fully flattened list. This risks unbounded memory bloat and potential `RangeError` if the list grows large.
**Action:** Replace `arr.flat().filter(...)` with `.flatMap(chunk => chunk.filter(...))` or similar patterns to efficiently map and filter sub-arrays without the memory bloat of `.flat()`.
