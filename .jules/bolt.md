## 2025-01-28 - Avoid array flatMap identity functions
**Learning:** Using `.flatMap(x => x)` when no mapping or filtering is required is a de-optimization because the native `.flat()` method is heavily optimized in V8/JS engines, whereas `flatMap` adds the CPU overhead of a callback per item.
**Action:** Use `.flat()` directly when simply flattening nested arrays.
