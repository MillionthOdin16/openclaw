## 2024-07-21 - Replace Array.prototype.flatMap(x => x) with native Array.prototype.flat()
**Learning:** Avoid replacing `.flat()` with `.flatMap((x) => x)` when no mapping or filtering is required. This is a de-optimization because the native `.flat()` method is heavily optimized in V8/JS engines, whereas `flatMap` adds the CPU overhead of a callback per item.
**Action:** Use `.flat()` directly to flatten arrays if mapping or filtering is not needed.
