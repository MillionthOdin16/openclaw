## 2025-02-18 - Avoiding intermediate array allocations in large text processing
**Learning:** Chaining array methods like .map().filter() when processing large arrays (like text blocks or logs) creates expensive intermediate array allocations and adds callback overhead, which can bottleneck high-frequency V8 execution paths.
**Action:** Combine operations into a single-pass for...of loop to optimize execution speed and reduce GC pressure.
