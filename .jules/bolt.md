## 2024-05-18 - Avoid map().find(Boolean) anti-pattern
**Learning:** Found several places using `array.map(transformFn).find(Boolean)`. This is inefficient because it eagerly evaluates the `transformFn` for every element in the array and allocates a new array before finding the first truthy result. For high-frequency pathways like session loading and identity resolution, this is an unnecessary penalty.
**Action:** Replace `array.map(transformFn).find(Boolean)` with a `for...of` loop with early return.
