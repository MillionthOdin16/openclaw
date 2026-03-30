## 2026-03-24 - gateway/session-utils Pattern

**Defect Pattern:** Eagerly loading full `sessions.json` for all agents simultaneously during hook dispatch causes Node.js heap exhaustion (OOM).
**Local Impact:** If our fork runs 10+ agents with large session stores, we are vulnerable to the same `loadCombinedSessionStoreForGateway` memory multiplier bug, especially when handling hook dispatches under load.
**Review Strategy:** Check `src/gateway/session-utils.ts` for `loadCombinedSessionStoreForGateway` and ensure we are lazy-loading session stores per agent or have implemented a pagination/pruning strategy.

## 2026-03-28 - Gateway Health Monitor Pattern

**Defect Pattern:** `channel-health-monitor.ts` restarts sockets continuously due to `stale-socket` misconfiguration, leaking memory over time and crashing the gateway with `JavaScript heap out of memory`.
**Local Impact:** If we run the health monitor with Discord or other connected channels, the aggressive restart loop on stable connections will eventually OOM our gateway process.
**Review Strategy:** Review `src/gateway/channel-health-monitor.ts` and `src/gateway/channel-health-policy.ts` to ensure memory leaks during socket restarts are addressed and stale socket evaluations don't excessively reconnect.

## 2026-03-29 - Filesystem Scan OOM Pattern

**Defect Pattern:** Unbounded recursive `AfterScanDir` calls (from `chokidar.watch` or direct fs polling) cause File Descriptor (FD) exhaustion or memory bloat, leading to `spawn EBADF` or OOM when the UI polls node lists.
**Local Impact:** UI polling operations or filesystem watchers like in `skills` or `workspace` scanning could cause our gateway to eventually exhaust heap memory or file descriptors after extended uptime.
**Review Strategy:** We have a known memory pattern here for `chokidar.watch`. Check for unbounded directory scanning during periodic UI checks or health polls.
