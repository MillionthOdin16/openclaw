## 2023-10-24 - String Match Optimization
**Learning:** Using `split()` for counting substring occurrences allocates unneeded array structures. When parsing large logs, this overhead adds up.
**Action:** Use a simple `indexOf()` loop instead of `split(needle).length - 1` when just counting occurrences.
