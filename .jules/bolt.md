## 2024-05-15 - Array Manipulation Allocations

**Learning:** Performance-critical logic involving array manipulation in this codebase can suffer from memory overhead due to redundant allocations from `.toSorted()`, `.map()`, `.filter()` chains.
**Action:** Prefer in-place sorting (`array.sort()`) and single-pass iteration over multiple functional chains to reduce memory overhead.
