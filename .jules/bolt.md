## 2025-02-18 - countMatches string matching performance
**Learning:** `haystack.split(needle).length - 1` allocates intermediate arrays, making it surprisingly slow for long strings. Using `indexOf` inside a `while` loop is significantly faster and doesn't allocate memory.
**Action:** Replace `split` with `indexOf` in string matching performance hotpaths when counting substring occurrences.
