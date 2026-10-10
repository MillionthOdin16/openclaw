## 2026-09-12 - Plugin DB Connections
**Defect Pattern:** Gateway crashes unexpectedly from server-initiated DB disconnects inside third-party plugins.
**Local Impact:** If we run plugins with long-lived DB connections (like PostgreSQL/pgvector), a simple server restart drops the whole Gateway process due to `uncaughtException`.
**Review Strategy:** Check the `uncaughtException` handler in `src/index.ts` and `src/cli/run-main.ts`. It exits blindly on any unhandled error without verifying if the error is a benign network/connection code (like `57P01` or general transient network codes).
