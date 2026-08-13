## 2026-08-13 - Avoid map().filter() chaining in hot paths
**Learning:** Chaining array methods like `.map().filter()` creates expensive intermediate array allocations and adds callback overhead, which can deoptimize V8 execution speed in high-performance paths.
**Action:** Combine operations into a single-pass `for...of` loop to avoid intermediate array allocations and callback overhead.
