## 2023-10-24 - Optimize countMatches string occurrence counting

**Learning:** Using split(needle).length - 1 to count substring occurrences creates an unnecessary intermediate array, which causes large GC pressure when parsing large log strings.
**Action:** Replace split allocations with an iterative indexOf loop advancing by pos + needle.length to improve performance and avoid GC overhead for log analysis.
