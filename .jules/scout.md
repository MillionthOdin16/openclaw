## 2026-09-12 - Core Crash Pattern
**Defect Pattern:** Uncaught exceptions in third-party database plugins crashing the core Gateway process.
**Local Impact:** Can take down all local channels if a plugin connection gets dropped by the remote database.
**Review Strategy:** Check unhandled rejection handlers for missing error codes.
