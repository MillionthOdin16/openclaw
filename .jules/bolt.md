## 2024-05-24 - Array Bloat Pattern

**Learning:** Found instances where `.flat()` is called just before mapping or filtering. When processing large arrays, doing `arr.map(...).flat()` or `.flat().filter()` can lead to unbounded memory usage because `.flat()` forces the entire flattened array to be materialized in memory before the subsequent filtering/mapping step.
**Action:** Replace `.flat().filter(x => ...)` and similar structures with `.flatMap(x => ...)` which processes element-by-element and avoids huge intermediate arrays.
