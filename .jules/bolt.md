
## 2024-03-09 - Chokidar Ignore Performance Bottleneck
**Learning:** `chokidar.watch` calls the `ignored` callback very frequently (for every file evaluated). Using `.split(path.sep).map()` inside this callback allocates arrays and iterates multiple times, creating a hidden performance bottleneck due to garbage collection pressure and memory usage, especially for deep directory structures.
**Action:** Use a `while` loop with `path.dirname` and `path.basename` for zero-allocation recursive path checking in high-frequency callbacks.
