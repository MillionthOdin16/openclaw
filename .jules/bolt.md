## 2024-05-24 - V8 Array Allocation Optimization
**Learning:** Chaining `.map().filter()` or `.filter().at(-1)` on arrays creates expensive intermediate array allocations which add overhead during frequent operations (like text redaction).
**Action:** Replace these chains with single-pass `for...of` or standard `for` loops in performance-critical or frequently called functions to optimize V8 execution speed and memory usage.
