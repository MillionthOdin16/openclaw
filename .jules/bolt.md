## 2024-05-18 - Avoid array.map(transformFn).find(Boolean)
**Learning:** The codebase has several places where `array.map(transformFn).find(Boolean)` is used. This is an anti-pattern because it eagerly evaluates `transformFn` for all elements and allocates intermediate arrays, when it only needs to find the first truthy value.
**Action:** Replace `array.map(transformFn).find(Boolean)` with a `for...of` loop and early return, or `reduce` / `find` where appropriate to evaluate lazily and avoid array allocations.
