## 2024-05-18 - Added tests for sniffMimeFromBase64
**Learning:** Utilities that parse binary formats from strings (e.g. Base64) are often untested but handle critical media upload pathways. They can fail gracefully but need proper coverage of their error conditions.
**Action:** Added comprehensive test suite for `sniffMimeFromBase64.ts` using vitest with mocked `detectMime` implementation to simulate graceful degradation.
