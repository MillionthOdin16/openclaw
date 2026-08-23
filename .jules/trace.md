## 2024-08-23 - Add tests for utility functions in utils.ts
**Learning:** Testing logic involving utf16 string indexing for multi-byte characters such as emojis is crucial to avoid out-of-bounds indexing bugs in formatting functions.
**Action:** Added extensive tests for surrogate-safe string truncation functions to `utils.test.ts`, effectively increasing coverage of essential formatting utils.
