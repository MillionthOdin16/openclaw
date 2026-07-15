## 2025-01-20 - [Optimize Array Operations]
**Learning:** Using chained array methods like `.map(...).filter(Boolean)` or `.filter(Boolean).map(...)` incurs an iteration penalty of 2n and creates unnecessary intermediate array allocations. V8/JS engines can optimize these better with `.flatMap(...)` when mapping and filtering happen in the same pass.
**Action:** Always refactor sequential `map` and `filter` array calls into a single `flatMap` pass when feasible to improve both memory footprint and runtime speed, particularly on larger datasets.
