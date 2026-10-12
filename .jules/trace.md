## 2024-10-12 - Missing Unit Tests in core Utils
**Learning:** Core util functions (boolean, chunk-items, safe-json) were present but entirely lacking unit tests despite handling important cross-cutting edge cases.
**Action:** Added complete test suites for boolean parsing, safe JSON stringification, and item chunking to ensure reliability and catch future regressions.
