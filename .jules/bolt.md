## 2024-10-24 - Optimize array status tallying
**Learning:** Multiple O(N) `.filter(predicate).length` passes to tally counts for a single array is a common anti-pattern that wastes CPU cycles and creates unnecessary intermediate array allocations, causing memory churn.
**Action:** Replace multiple filter-length checks over the same array with a single O(N) `for...of` loop tallying all required counts in a single pass.
