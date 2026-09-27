## 2025-01-20 - Non-allocating String Counting
**Learning:** Using ".split(needle).length - 1" to count matches allocates an intermediate array and copies string segments, which is significantly slower than using an "indexOf" loop. Memory allocation can become a bottleneck when processing large logs or rapidly executing code paths.
**Action:** Prefer a "while" loop with "indexOf(needle, pos + needle.length)" for counting substring occurrences without creating intermediate allocations.
