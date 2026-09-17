## 2024-03-08 - Optimize countMatches
**Learning:** In highly trafficked logging parsing loops, using `.split(needle).length - 1` to count occurrences is noticeably slower and more memory intensive due to intermediate array creation.
**Action:** Replace string splitting count logic with an efficient `indexOf` `while` loop that avoids allocations completely. When replacing, advance the index by `pos + needle.length` to correctly replicate `split`'s handling of non-overlapping matches.
