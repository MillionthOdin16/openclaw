## 2024-12-10 - String matching performance
**Learning:** Using `haystack.split(needle).length - 1` is an O(N) memory anti-pattern for counting substring occurrences because it allocates an entire array of intermediate substrings just to count them.
**Action:** Replace with an `indexOf` loop which operates in O(1) memory and is substantially faster, especially on large log strings or JSON payloads.
