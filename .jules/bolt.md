## 2026-03-09 - Memoize extraction methods in chat UI

**Learning:** Reactivity performance in the Lit chat interface `grouped-render.ts` and `tool-cards.ts` can be degraded due to repeatedly calculating complex state per-message on re-renders, particularly formatting tools/images. A WeakMap cache bound to the message object preserves referential equality across updates.
**Action:** Always consider memoization via WeakMap keyed on the raw object for pure parsing functions that extract derived state from static object fields within frequently rendered UI loops.
