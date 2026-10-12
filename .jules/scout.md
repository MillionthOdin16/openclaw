## 2026-10-12 - SQLite State Persistence Pattern
**Defect Pattern:** We keep inheriting SQLite locking, starvation, and index full-scan issues from upstream, especially in `memory-core` indexing paths. Upstream often relies on synchronous SQLite calls that block the Node main thread.
**Local Impact:** This directly affects our Gateway event loop. Features like memory vector replacement (`DELETE FROM`) or on-demand `memory_search` index reconciliation can stall our instance RPC when processing large datasets.
**Review Strategy:** Double-check `src/memory/manager*.ts` paths whenever modifying memory syncing, particularly looking out for ad-hoc `sync()` calls on interactive paths or `.run()`/`.exec()` full-table modifying calls inside hot loops.

## 2026-10-12 - Unbounded Restart Recovery Pattern
**Defect Pattern:** Crash-loop bugs (like EXC_GUARD failures) that crash the node process are repeatedly resumed by `main-session-restart-recovery` on startup. Upstream has no backoff or tombstoning threshold for repeatedly failing session recovery attempts.
**Local Impact:** If an active session state triggers a crash, our fork will enter an infinite crash-reboot cycle on launchd/systemd, taking down all channels.
**Review Strategy:** Review `src/cli/gateway-cli/run-loop.ts` and related lifecycle code to ensure that we correctly tombstone or back off broken sessions instead of indefinitely attempting to resume them.
