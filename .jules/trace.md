## 2025-03-09 - Increase code coverage in utils.ts
**Learning:**
There are multiple utility functions such as sliceUtf16Safe, isSelfChatMode, and safeParseJson that lack test coverage, keeping the line coverage below the 70% threshold.

**Action:**
Added unit tests for these missing functions in src/utils.test.ts to increase line coverage and overall codebase reliability.
