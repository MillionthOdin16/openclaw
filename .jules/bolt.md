## 2025-03-08 - Array Iteration Chains
**Learning:** Chaining array methods like `.filter().map()` creates expensive intermediate array allocations.
**Action:** Use a single `for...of` loop when processing lists to eliminate intermediate allocations and callback overhead.
