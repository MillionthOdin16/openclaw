## 2026-07-29 - [pnpm build] Pattern
**Defect Pattern:** The `pnpm build` process rewrites `dist/` directly before subsequent build gates (like `ui:build` and other validation steps) run. If a later step fails, the `dist/` folder is left in an inconsistent, half-adopted state, which can cause the gateway to crash on its next restart.
**Local Impact:** This issue, inherited from upstream (#106768), affects our local build process as we use the same `build-all.mjs` script structure via `package.json` build scripts. A failed `pnpm build` may deploy an incomplete or unvalidated runtime locally, leading to crash-loops when the gateway or TUI restart.
**Review Strategy:** When reviewing or modifying build scripts (`package.json` scripts, `scripts/tsdown-build.mjs`, etc.), check for operations that mutate the live `dist/` directly without atomic swaps or validation gates executing first.

## 2026-07-29 - [memory_search] Pattern
**Defect Pattern:** The `memory_search` tool can keep using a stale cached memory manager after the underlying memory index identity changes, causing searches to time out or return false zero-hit results.
**Local Impact:** This issue, inherited from upstream (#111990), causes agents in our local gateway to miss prior-session context or report false zero-hit results, as the tool runtime caches the manager and doesn't refresh it when the index identity changes.
**Review Strategy:** When reviewing the memory-core extension (`extensions/memory-core`), check the `memory_search` tool implementation for proper manager lifecycle management and cache invalidation when the index identity is stale.
