## 2026-08-20 - Optimize log tail processing
**Learning:** In high-performance log line processing, chained array operations like `.map().filter()` create large intermediate array allocations and callback overhead.
**Action:** Use a single-pass `for...of` loop instead to combine trimming and filtering operations, significantly reducing V8 execution time.
