## 2025-05-18 - Avoid Eager Memory Allocation in Session Store Iteration

**Learning:** Eagerly parsing and transforming massive sets of session records via `Object.entries(store).filter(...).map(...)` inside the gateway server consumes massive amounts of temporary memory and starves the event loop under heavy load.
**Action:** Use an `IterableIterator` generator (`function*`) over keys to evaluate mapping strictly as lazily as possible, discarding items that fail simple string or timestamp filters early.
