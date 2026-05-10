## 2024-05-10 - Gateway Session Store Eager Loading

**Learning:** The OpenClaw project exhibits an anti-pattern where unbounded JSON session stores were loaded simultaneously into a single large object via `loadCombinedSessionStoreForGateway`, causing OOM exhaustion during concurrent access.
**Action:** When merging or scanning large datasets across multiple JSON files, use lazy `IterableIterator` generators to yield processed entries individually instead of eagerly building a massive intermediate `Record` or array.
