## 2024-03-09 - String concatenation beats array methods for serialization
**Learning:** `stableStringify` function was spending a lot of time in `.map()`, `.join()`, and template literal overhead. Replacing it with a custom string builder `+=` and manually looping over items provided an approximately 3x performance increase.
**Action:** When working on serialization performance in hot paths (like caching/deduplication loops where `stableStringify` is heavily used), prefer manual iteration and standard string concatenation over `.map().join()`.
