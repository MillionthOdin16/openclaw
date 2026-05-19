## 2025-02-12 - Gateway Session Store OOM

**Learning:** Eagerly loading unbounded JSON session stores simultaneously via `Object.entries(store).filter().map()` causes memory bloat and eventual OOM exhaustion during concurrent access due to massive intermediate array allocations.
**Action:** Use lazy `IterableIterator` generators when processing large unbounded object maps to yield processed entries individually, allocating only the final filtered array.
