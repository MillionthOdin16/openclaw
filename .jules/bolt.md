## 2024-05-18 - Avoid spread operator for filtering large arrays

**Learning:** Array bloat and stack overflows due to `.flat()` and push with spread syntax can kill performance when parsing logs. Large data fetches using `.flat()` before filtering causes massive intermediate arrays, creating unbounded memory bloat. Also `arr.push(...elements)` causes `RangeError` from call stack exhaustion.

**Action:** Don't construct arrays by mapping `.flat()` over all entries before filtering. Instead, filter concurrently across chunks and collect the matching entries directly into a single result array to prevent unbounded memory load.
