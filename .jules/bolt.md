## 2025-03-08 - Avoid Chained Array Allocations in Hot Paths
**Learning:** Chaining array methods like `.map().filter()` causes expensive intermediate array allocations and significant callback overhead, which can accumulate in highly used utility functions like `normalizeStringEntries`.
**Action:** Replace `.map().filter()` chains with a single-pass `for...of` loop in critical performance paths to optimize V8 execution speed.
