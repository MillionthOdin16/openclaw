## 2025-01-15 - Optimize string matching with indexOf
**Learning:** In hot parsing paths (like `consumeJsonBlock` in `src/commands/status-all/gateway.ts`), using `.split(needle).length - 1` to count occurrences causes unnecessary intermediate array allocations, adding memory overhead and GC pressure.
**Action:** Replace `.split()` with a `while` loop using `indexOf()` advancing by `pos + needle.length` to count occurrences without allocating arrays.
