## 2024-10-09 - Optimize countMatches string matching
**Learning:** Using .split() to count string occurrences causes unnecessary array allocations, which degrades performance on large inputs.
**Action:** Use a while loop with .indexOf() to count occurrences efficiently without memory overhead.
