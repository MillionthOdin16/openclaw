## 2024-10-15 - Optimize stop word lookup for query expansion
**Learning:** Checking a token against multiple individual Sets sequentially causes an O(N) factor in lookups per token parsed, which compounds over many tokens.
**Action:** Combine static dictionary sets (like stop words across languages) into a single overarching Set during initialization to ensure true O(1) lookups.
