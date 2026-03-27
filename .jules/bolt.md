## 2024-05-18 - Avoid `.map(transform).find(Boolean)` array anti-pattern

**Learning:** Using `array.map(transformFn).find(Boolean)` is an inefficient anti-pattern, especially on hot paths like gateway session lookups and routing. It eagerly evaluates `transformFn` for all elements and allocates an intermediate array, completely defeating the purpose of an early-exit `.find()`.
**Action:** Always replace this pattern with a lazy `for...of` loop and an early `break`/`return`. This completely avoids the intermediate array allocation and stops transforming elements as soon as a truthy value is found.
