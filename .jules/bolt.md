## 2024-05-24 - Array Chaining Optimization
**Learning:** In high-performance utility paths processing many strings (like `normalizeStringEntries` used heavily across `allowFrom` matching and CLI parsing), chaining `.map().filter()` causes measurable execution overhead (~30% slower in V8) due to intermediate array allocations and multiple pass loops.
**Action:** Combine multi-step array processing into a single-pass `for...of` loop to avoid intermediate allocations and reduce callback overhead on hot paths.
