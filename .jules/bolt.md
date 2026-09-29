## 2024-03-09 - Optimize countMatches string matching
**Learning:** Using "split().length - 1" to count string occurrences creates unnecessary intermediate arrays, harming performance in high-throughput parsing like log tail summarization.
**Action:** Replace "split().length - 1" with a while loop using "indexOf(needle, pos)" and "pos += needle.length", which avoids allocation and is faster.
