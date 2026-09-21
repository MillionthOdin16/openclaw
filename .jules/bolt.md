## 2026-03-09 - Avoid .split().length - 1 for substring counting
**Learning:** Using `string.split(needle).length - 1` to count substring occurrences creates unnecessary intermediate arrays and string segments, causing extra memory allocation and garbage collection overhead.
**Action:** Replace this pattern with a `while` loop using `indexOf` to count occurrences in-place without allocating new objects. Advance the index by `pos + needle.length` to avoid overlapping matches.
