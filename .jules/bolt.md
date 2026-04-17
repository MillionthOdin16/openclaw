## 2024-04-17 - WeakMap Memoization for Frontend UI Parsing

**Learning:** In the frontend chat interface, `WeakMap` is an effective pattern for memoizing expensive parsing operations (e.g., extracting images or tool cards) by keying off raw message objects. This prevents redundant calculations during frequent UI re-renders and preserves referential equality.
**Action:** Apply `WeakMap` memoization to `extractImages` and `extractToolCards` functions in the UI since chat re-renders are frequent.
