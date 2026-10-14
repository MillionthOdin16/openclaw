## 2025-03-08 - Avoid localeCompare in hot loops
**Learning:** In tight loops, such as sorting markdown style spans during chunking and parsing, `String.prototype.localeCompare()` can become a significant performance bottleneck due to Intl API overhead.
**Action:** Use native comparison operators (`<`, `>`) to implement standard string comparisons when language-sensitive sorting is not strictly required.
