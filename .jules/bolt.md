## 2024-03-20 - Inefficient array find pattern
**Learning:** The `array.map(transformFn).find(Boolean)` pattern eagerly evaluates `transformFn` for all elements and allocates an intermediate array before searching for a truthy value. This is highly inefficient compared to a `for...of` loop with an early return, especially for operations like reading from maps, fetching secrets, or normalizing inputs.
**Action:** Replace `array.map(transformFn).find(Boolean)` with a `for...of` loop and early return where appropriate to save memory and skip redundant evaluations once a matching value is found.
