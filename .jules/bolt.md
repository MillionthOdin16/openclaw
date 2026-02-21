## 2025-02-21 - Synchronous File I/O in Utility Loops
**Learning:** `jidToE164` utility performs synchronous file reads (`fs.readFileSync`) inside a loop over configuration directories for every LID lookup. This creates a hidden performance tax (approx 150us per call vs 3us cached) that scales with message volume for LID users.
**Action:** Always audit utility functions used in hot paths (message processing) for blocking I/O operations. Implement memory caching with strict bounds (limit + TTL) to mitigate this without introducing memory leaks.
