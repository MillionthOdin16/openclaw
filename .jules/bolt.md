
## 2024-05-24 - WeakMap caching for UI rendering performance
**Learning:** Using `WeakMap` is an effective pattern for memoizing expensive parsing operations (e.g., extracting images or tool cards) by keying off raw message objects. This prevents redundant calculations during frequent UI re-renders and preserves referential equality without leaking memory.
**Action:** Use `WeakMap` to cache derived states from complex objects when the object references are stable and calculations are invoked repeatedly (like in render loops).
