## 2024-09-14 - Replace .split().length - 1 with indexOf loop

**Learning:** Using `haystack.split(needle).length - 1` to count substring occurrences is an O(N) memory allocation and processing bottleneck, particularly for large strings, because it creates an array of string fragments.
**Action:** Replace it with an `indexOf` loop which operates in O(N) time with O(1) memory, advancing the search index by `pos + needle.length`.
