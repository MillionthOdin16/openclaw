## 2026-03-09 - Watcher path filtering optimization
**Learning:** Using `split(path.sep).map(...)` inside high-frequency chokidar `ignored` callbacks allocates excessive arrays, creating GC pressure and risking FD exhaustion.
**Action:** Replace `split` with bottom-up lazy evaluation using a `while` loop, `path.basename()`, and `path.dirname()` for allocation-free directory traversal.
