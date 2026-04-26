## 2024-03-09 - In-place Sorting and Iteration
**Learning:** Performance-critical logic involving array manipulation should prefer in-place sorting and single-pass iteration over multiple functional chains (like `.toSorted()`, `.map()`, `.filter()`) to reduce memory overhead and redundant allocations.
**Action:** When finding array mappings/filterings chained with sorting, refactor to sort in-place and iterate in a single pass.
