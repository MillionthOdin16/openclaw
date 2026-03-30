
## 2025-03-30 - Chokidar watch filter array allocations
**Learning:** In high-frequency path evaluation functions like `chokidar.watch` ignore filters (e.g., `shouldIgnoreMemoryWatchPath`), using `path.split(path.sep).map()` creates significant GC pressure and CPU overhead from excessive string operations and intermediate array allocations.
**Action:** Always optimize path evaluation in tight loops or frequent callbacks by using a zero-allocation `while` loop with `path.dirname(p)` and `path.basename(p)` for lazy evaluation from the leaf segment upwards.
