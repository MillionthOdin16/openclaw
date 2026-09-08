## 2026-03-08 - Optimize string counting in log summarizer
**Learning:** Found a micro-optimization opportunity in gateway diagnostics string parsing where `countMatches` used `haystack.split(needle).length - 1` to count matches, unnecessarily allocating arrays.
**Action:** Replaced `.split().length - 1` with a `while` loop using `.indexOf()`.
