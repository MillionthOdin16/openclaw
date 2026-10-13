## 2024-10-13 - Avoid String.prototype.split for substring counting

**Learning:** Using String.prototype.split to count substring occurrences creates unnecessary intermediate array allocations, which degrades performance in hot paths like log parsing.
**Action:** Use String.prototype.indexOf in a while loop to count occurrences without memory allocation overhead.
