
## 2026-08-23 - Array methods overhead
**Learning:** Chaining array methods like `.map().filter()` when processing text creates expensive intermediate array allocations and callback overhead.
**Action:** Use a single-pass `for...of` loop to significantly optimize V8 execution speed by avoiding both intermediate array allocations and callback overhead.
