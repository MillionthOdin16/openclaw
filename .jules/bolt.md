## 2026-02-16 - [Unexpected Performance Win via Linting]
**Learning:** Sometimes "unused variable" lint errors point to expensive operations that are computed but never used. In this case, `resolveSessionVerboseLevel` was triggering a synchronous file read (`loadSessionStore`) for every message, but the result was discarded.
**Action:** Pay close attention to lint warnings about unused variables, especially if they are assigned the result of a function call. It might be dead code executing expensive logic.
