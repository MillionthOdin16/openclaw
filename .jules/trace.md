## 2026-08-21 - Tests for sliceUtf16Safe, truncateUtf16Safe, and isSelfChatMode
**Learning:** `sliceUtf16Safe` and `truncateUtf16Safe` handle surrogate pairs properly to avoid splitting emojis. `isSelfChatMode` compares a phone number with an array of allowed numbers.
**Action:** Added unit tests for these utilities to `src/utils.test.ts` to improve test coverage.
