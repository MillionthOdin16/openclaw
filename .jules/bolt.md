## 2026-03-09 - Replace array.map().find(Boolean) with early return loops

**Learning:** The `array.map(transformFn).find(Boolean)` pattern is an inefficient anti-pattern, particularly in text parsing and session array lookups. It eagerly evaluates `transformFn` for every element and allocates an intermediate array before finding the first truthy value.
**Action:** When searching for a single truthy value after transformation, use a `for...of` loop with an early `break` or `return`. This skips unnecessary processing and reduces memory allocation overhead.
