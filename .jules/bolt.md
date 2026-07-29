## 2024-07-29 - Array Flattening Micro-Optimization
**Learning:** In V8/JS engines, calling `.flatMap((x) => x)` adds the CPU overhead of invoking a callback per item compared to the native, heavily optimized `.flat()`.
**Action:** Always prefer `.flat()` over `.flatMap((x) => x)` when no mapping or filtering is needed in the same pass.
