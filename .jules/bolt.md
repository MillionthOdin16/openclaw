## 2025-04-19 - Chat UI Rendering Optimizations
**Learning:** In the frontend chat interface, `WeakMap` is an effective pattern for memoizing expensive parsing operations (e.g., extracting images or tool cards) by keying off raw message objects. This prevents redundant calculations during frequent UI re-renders and preserves referential equality.
**Action:** Use `WeakMap` caching for expensive extractions in components rendered inside lists or frequent UI updates.
