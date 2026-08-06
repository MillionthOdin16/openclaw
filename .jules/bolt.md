## 2025-01-01 - Avoid Map/Filter Intermediate Allocations
**Learning:** Chaining `.map().filter()` causes intermediate array allocations, adding overhead and increasing garbage collection pressure.
**Action:** When mapping and filtering arrays, replace `.map().filter()` chains with a single `for...of` loop to optimize execution time and reduce memory allocations.
