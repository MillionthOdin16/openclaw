## 2026-04-05 - Array find(Boolean) optimization
**Learning:** The `array.map(transformFn).find(Boolean)` pattern is inefficient as it eagerly evaluates `transformFn` for all elements and allocates intermediate arrays, when it could stop early on the first match.
**Action:** Use a `for...of` loop with an early return to optimize searching for the first truthy transformed value.
