## 2025-03-09 - Avoid chaining array map and filter methods
**Learning:** Chaining `.map().filter()` array methods creates expensive intermediate array allocations and causes V8 execution overhead.
**Action:** Replace these chains with a single-pass `for...of` loop when optimizing high-performance paths or dealing with large datasets to significantly improve execution speed and reduce memory allocations.
