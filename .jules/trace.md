## 2024-04-03 - [Increase utils test coverage]
**Learning:** Some util functions like chunkItems, safeJsonStringify, parseBooleanValue, providerUtils, accountId, shellArgv, fetchTimeout, withTimeout lacked test coverage, which left common utils at risk of regressions.
**Action:** Added targeted test files in `src/utils/` to improve the overall reliability of these utility functions.
