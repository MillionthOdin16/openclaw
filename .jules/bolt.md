## 2026-03-01 - Add caching to readLidReverseMapping
**Learning:** The `readLidReverseMapping` function repeatedly calls `fs.readFileSync` to look up WhatsApp Linked IDs. Because this occurs for incoming messages and mentions, it results in excessive blocking disk I/O.
**Action:** Implement an in-memory `Map` cache with a composite key and negative caching (TTL of 5 minutes) to avoid repeated synchronous disk reads for the same LID.
