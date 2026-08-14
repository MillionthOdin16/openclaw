## 2024-05-24 - V8 Array Method Chaining Overhead
**Learning:** Chaining array methods like `.map().filter()` or `.filter().map()` creates intermediate array allocations and incurs callback overhead. This is especially impactful in foundational utilities like `normalizeStringEntries` that are called frequently across the codebase for configuration parsing, policy evaluation, and string normalization.
**Action:** Replace `.map().filter()` chains with a single-pass `for...of` loop in high-frequency utility functions to optimize V8 execution speed, reducing memory allocations and GC pressure.
