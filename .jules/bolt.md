## 2024-10-21 - countMatches String Split Overhead

**Learning:** The `countMatches` function in `src/commands/status-all/gateway.ts` currently splits strings into arrays to count matches. This requires full memory allocation for string arrays which is expensive especially in log processing pipelines.
**Action:** Replace `split().length - 1` with a `indexOf` loop which operates on strings in-place without generating garbage intermediate arrays.
