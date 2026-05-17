## 2024-05-17 - [CRITICAL] Gateway Event Loop Starvation

**Vulnerability:** Gateway event loop is permanently blocked by long-running synchronous `exec` tool calls (e.g., via `spawnSync`) that lack watchdogs/timeouts, leading to gateway unresponsiveness and connection failures.
**Learning:** Synchronous OS commands like `spawnSync` without timeouts can block the single-threaded Node.js event loop indefinitely if the command hangs.
**Prevention:** Always include a `timeout` option (e.g., `timeout: 5000`) for all synchronous execution calls (`spawnSync`, `execSync`, `execFileSync`).
