## 2025-03-08 - String Matching Performance
**Learning:** Using `split().length - 1` for counting substring occurrences allocates multiple arrays of substrings, making it slower and more memory-intensive, especially for large strings.
**Action:** Replace `split().length - 1` with an `indexOf` loop which only allocates memory for the match variables. Advance the index by `needle.length` instead of `+1` to support non-overlapping matches identically to `split()`.
