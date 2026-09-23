## 2024-05-24 - Counting occurrences optimization
**Learning:** Using `string.split(needle).length - 1` to count occurrences is inefficient because it creates an array of substrings and allocates memory for all of them. This is especially slow and memory-intensive for large strings.
**Action:** Replace it with a `while` loop that uses `indexOf` to count matches. When doing this, remember to advance the search index by `pos + needle.length` (not `pos + 1`) to correctly count non-overlapping matches and preserve the original `.split()` behavior.
