## 2023-10-11 - Optimize countMatches string matching
**Learning:** Using `haystack.split(needle).length - 1` to count substring occurrences creates an intermediate array containing all parts of the split string. When called repeatedly in loops (like counting '{' and '}' during JSON block consumption), this allocates many arrays, causing GC pressure and overhead. Using `indexOf` in a `while` loop is significantly faster for counting occurrences without array allocation.
**Action:** Replace `split` based substring counting with an `indexOf` loop for performance-sensitive text parsing routines.
