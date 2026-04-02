## 2025-04-02 - Array.map().find(Boolean) is an Anti-Pattern

**Learning:** Using `array.map(transformFn).find(Boolean)` is a common anti-pattern that can hurt performance, especially on hot paths or large arrays. It eagerly evaluates `transformFn` for all elements and allocates an intermediate array before searching.

**Action:** Replace `array.map(transformFn).find(Boolean)` with a `for...of` loop and an early return. This completely avoids array allocations and stops processing as soon as a truthy value is found.
