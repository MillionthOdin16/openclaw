## 2025-02-18 - Optimize array allocations in log redaction
**Learning:** Chaining `.map().filter()` array methods on high-frequency paths creates expensive intermediate array allocations which must be avoided when processing large buffers like logs.
**Action:** Combine the operations into a single-pass `for...of` loop to significantly optimize V8 execution speed by avoiding intermediate array allocations and callback overhead.
