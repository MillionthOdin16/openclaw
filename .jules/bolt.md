## 2024-10-24 - indexOf over split for Substrings
**Learning:** `string.split(needle).length - 1` is inefficient for substring counting since it allocates multiple string arrays.
**Action:** Use `indexOf(needle, pos)` loop to optimize `.split().length` for non-overlapping counting.
