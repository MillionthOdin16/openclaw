## 2026-06-24 - [Agents] Pattern

**Defect Pattern:** Chokidar FD Leak Pattern. Unclosed file descriptors (FDs) left open by chokidar when file watchers aren't properly torn down. Map entries storing state per-workspace keep accumulating unbounded.
**Local Impact:** `src/agents/skills/refresh.ts` retains `SkillsWatchState` in a `Map` that is never evicted, causing FDs to leak when watchers are instantiated for varying workspace directories and never explicitly closed. This leads to Gateway degradation and event-loop starvation over time due to FD exhaustion.
**Review Strategy:** Check for missing `watcher.close()` calls, un-evicted map entries, or missing teardown paths whenever `chokidar.watch` is used, particularly in modules dealing with dynamic paths.

## 2026-06-24 - [Config] Pattern

**Defect Pattern:** Unbounded Memory Load Pattern. Loading entire session datasets synchronously using `readFileSync` without pagination or streaming.
**Local Impact:** `src/config/sessions/store.ts` loads full session state into memory using `readFileSync`, causing massive memory footprints, risking heap threshold alerts, event-loop starvation, and OOM crashes.
**Review Strategy:** Check for synchronous or bulk file reading operations in systems designed to handle unbounded or growing datasets.

## 2026-06-24 - [Agents] Pattern

**Defect Pattern:** Unclosed FileHandle Pattern. Missing explicit `.close()` on `fs.FileHandle` instances, especially on error/interrupt paths, leading to GC-driven ERR_INVALID_STATE crashes on Node 24+.
**Local Impact:** `src/agents/session-write-lock.ts` takes `.jsonl.lock` FileHandles and has paths where handles aren't explicitly closed, leading to Gateway crashes under sustained load when V8 garbage collects the unclosed handle.
**Review Strategy:** Audit `fs.promises.open` and `FileHandle` call sites. Ensure `try...finally { await handle?.close(); }` is always used around `FileHandle` operations, and avoid relying on GC.
