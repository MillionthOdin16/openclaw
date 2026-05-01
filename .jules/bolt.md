## 2024-05-01 - [Avoid map and filter chaining]

**Learning:** Chaining `.map()` and `.filter()` creates intermediate arrays and iterates multiple times.
**Action:** Use `.reduce()` or a `for` loop to accomplish both in a single pass when performance is critical.
