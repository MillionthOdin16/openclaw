## 2025-03-01 - Avoid split().length for substring counting

**Learning:** Using ".split(needle).length - 1" to count occurrences of a substring allocates unnecessary arrays and can be significantly slower than a simple "indexOf" loop, especially on large strings.
**Action:** Use an "indexOf" loop that advances by "pos + needle.length" to avoid object allocation and preserve non-overlapping match counting behavior.
