## 2026-02-13 - [Performance] Markdown Cache Thrashing
**Learning:** The UI has a hard `MARKDOWN_CACHE_LIMIT` of 200 items. With chat history limit of 200 messages + reasoning blocks, the cache limit is exceeded, causing constant re-parsing and re-rendering of markdown on every state update.
**Action:** When increasing chat render limits or adding new markdown-heavy features (like reasoning), always ensure the markdown cache size accommodates the worst-case visible items to prevent thrashing.
