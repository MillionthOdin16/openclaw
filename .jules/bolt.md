## 2025-02-18 - Prevented unbounded memory load with large log parsing

**Learning:** The application parsed large JSONL log files concurrently and grouped all parsed data into a huge array of arrays, and then used `.flat()` on it before filtering. This caused massive unbounded memory allocation and `RangeError: Maximum call stack size exceeded` errors if there were too many entries. Spreading arrays (`.push(...chunks)`) also exceeds stack limits.
**Action:** When filtering map-reduced data chunks, always filter them inside the promise and iterate over the chunks using `for...of` to directly push entries into a flat result array instead of relying on `.flat()` or `.push(...elements)`.
