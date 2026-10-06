## 2024-10-24 - Array Chaining Anti-Pattern

**Learning:** Using chained ".map(...).find(Boolean)" to resolve fallback candidates causes unnecessary execution. It loops over the entire array, applies transformations, allocates a new array, and only then searches for the first truthy value.
**Action:** Replace early-exit lookup maps like ".map(...).find(Boolean)" with a "for...of" loop that evaluates lazily, breaking exactly when a truthy value is found to prevent redundant computation.
