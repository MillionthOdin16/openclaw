## 2024-05-18 - Optimize normalizeStringEntries
**Learning:** Found a hotspot with map and filter in string normalization. Using a traditional for loop instead of `.map().filter()` reduces memory allocations from intermediate arrays and decreases latency for string normalization.
**Action:** Replaced the array map/filter chain with a simple loop in `normalizeStringEntries`.
