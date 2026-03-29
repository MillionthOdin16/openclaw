## $(date +"%Y-%m-%d") - Discord Health Monitor Restart Crash
**Defect Pattern:** The Discord health monitor correctly detects a stale socket and triggers a restart. However, the abort handler sets `gateway.options.reconnect = { maxAttempts: 0 }` to prevent reconnection during a shutdown. Since the health monitor initiates a restart, it sets the max attempts to zero. The subsequent WebSocket close handler triggers `handleReconnectionAttempt` which then throws an uncaught exception (`Error: Max reconnect attempts (0) reached after code 1005`) because `maxAttempts` is 0. This crashes the gateway process.
**Local Impact:** This bug causes the entire OpenClaw gateway to crash whenever the Discord channel health monitor detects a stale socket, making the Discord integration unstable and requiring a manual restart of the entire gateway process.
**Review Strategy:** Check the `onAbort` handler in `src/discord/monitor/provider.lifecycle.ts`. Setting `gateway.options.reconnect = { maxAttempts: 0 };` creates a race condition causing uncaught exceptions. We should use a different flag or cleanly catch the error without crashing the process.

## $(date +"%Y-%m-%d") - Session Reset Race Condition
**Defect Pattern:** A race condition exists between an active, draining embedded run and the `/new` command, which rotates the session key. If the embedded run completes after the reset is initiated, the system leaks the `deactivated_workspace` internal error directly to the user's chat.
**Local Impact:** Intermittently, users receive raw backend JSON (`{"detail":{"code":"deactivated_workspace"}}`) instead of a clean reset.
**Review Strategy:** Review the session and workspace management logic, especially where `/new` operates and how pending embedded runs are finalized or aborted.

## $(date +"%Y-%m-%d") - Missing dist/package.json
**Defect Pattern:** The system explicitly looks for `dist/package.json` at runtime, which is missing in the production build or packaging structure (e.g. for the `memory-lancedb` plugin). This throws an `ENOENT` error.
**Local Impact:** The gateway fails to load plugins or certain features (like `memory search`), preventing core components from operating properly.
**Review Strategy:** Review how the codebase (likely plugin or memory loaders) resolves its package context and version metadata.
