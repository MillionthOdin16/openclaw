## 2025-03-09 - Optimize string occurrences count
**Learning:** `split(needle).length - 1` allocates intermediate arrays and strings which is inefficient for counting substring occurrences in a string, particularly large string payloads like logs.
**Action:** Use an `indexOf` loop with `needle.length` advancement which is significantly faster and uses less memory. Ensure `needle` is not empty to avoid infinite loops.
