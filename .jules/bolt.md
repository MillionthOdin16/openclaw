## 2025-03-08 - Optimize substring counting
**Learning:** Counting substrings using `.split(needle).length - 1` allocates an intermediate array, which is inefficient.
**Action:** Replace it with an `indexOf` loop which provides the same count without allocating any new arrays.
