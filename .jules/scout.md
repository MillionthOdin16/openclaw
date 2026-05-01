## 2026-05-01 - Gateway Pattern
**Defect Pattern:** The OpenClaw project exhibits a 'Gateway Stuck Session' defect pattern where the runtime diagnostic subsystem identifies and logs stuck sessions (e.g., via `stuckSessionWarnMs` in `diagnostic.ts`) but lacks an automated recovery mechanism to abort them, causing the gateway process to hang indefinitely.
**Local Impact:** Can cause indefinite hanging of the gateway process in our local fork.
**Review Strategy:** Check `src/logging/diagnostic.ts` and related session management files for recovery mechanisms.

## 2026-05-01 - Gateway Session Store Pattern
**Defect Pattern:** The OpenClaw project exhibits a 'Gateway Session Store' defect pattern where eagerly loading unbounded JSON files (`sessions.json`) into memory unconditionally across all configured agents (e.g., via `loadCombinedSessionStoreForGateway`) causes severe V8 heap exhaustion and OOM crashes during concurrent requests, hook dispatches, or `sessions.list` polling.
**Local Impact:** Can cause severe V8 heap exhaustion and OOM crashes in our local fork.
**Review Strategy:** Check `src/gateway/session-utils.ts` and `loadCombinedSessionStoreForGateway` usage for memory optimizations.

## 2026-05-01 - URL Encoding Path Traversal
**Defect Pattern:** The project exhibits a 'URL Encoding Path Traversal' vulnerability pattern where custom path validators (e.g., `isSafeRelativePath`) fail to handle URL-encoded path segments (like `%2e%2e%2f`).
**Local Impact:** Allows unauthorized access to arbitrary files on the local filesystem.
**Review Strategy:** Check custom path validators for URL decoding and use of `path.normalize()`.

## 2026-05-01 - Global Undici Agent Degradation Pattern
**Defect Pattern:** The OpenClaw project exhibits a pattern where long-running processes using shared global `undici` agents or unmanaged fetch dispatchers experience multi-subsystem network/timer degradation over time (e.g., `fetchWithSsrFGuard` or global fetch), causing timeouts across unrelated subsystems (pricing, polling, RPCs).
**Local Impact:** Can cause severe timeouts and unresponsiveness in long-running processes (e.g., the gateway) across our local fork.
**Review Strategy:** Check network components and fetch usages (like `fetchWithSsrFGuard` in `src/infra/net/fetch-guard.ts` or pricing fetchers) for proper dispatcher management and connection pooling limits.
