## 2024-10-17 - Utils test coverage improvements

**Learning:** There was missing test coverage for various generic utility functions in `src/utils.ts`.

**Action:** Added a set of describe blocks for many small missing utilities, such as `pathExists`, `clampNumber`, `clampInt`, `escapeRegExp`, `safeParseJson`, `isRecord`, `isSelfChatMode`, `sliceUtf16Safe`, `truncateUtf16Safe`, `displayPath`, `displayString`, and `formatTerminalLink`. The overall file coverage went from around 59% up to >91%.
