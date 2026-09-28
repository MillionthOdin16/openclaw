## 2024-09-28 - Avoid .split() for Counting String Occurrences
**Learning:** In Node.js, 'haystack.split(needle).length - 1' is significantly slower (up to ~35%) than a while loop using 'indexOf(needle)' for counting string occurrences, due to the overhead of allocating intermediate arrays.
**Action:** When counting occurrences of a substring, use a 'while' loop with 'indexOf(needle, pos)' and advance the position by 'pos + needle.length' to avoid unnecessary heap allocations.
