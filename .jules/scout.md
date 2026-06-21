## 2026-06-21 - [memory_search] Pattern

**Defect Pattern:** Chokidar FD Leak Pattern (Persistent read-only file descriptors on individual files cause linear FD exhaustion / silent watcher failure).
**Local Impact:** The file watcher in `src/agents/skills/refresh.ts` binds to specific `SKILL.md` files instead of directories, exhausting FDs and causing the file watcher to silently drop events, so skill snapshots become stale.
**Review Strategy:** Double-check `chokidar.watch` calls to ensure they target directories and properly bound their FD lifecycle.

## 2026-06-21 - [gateway] Pattern

**Defect Pattern:** Unbounded Memory Load Pattern (Reading oversized monolithic JSON files synchronously into memory causes massive heap pressure / OOM).
**Local Impact:** The `src/config/sessions/store.ts` module uses `fs.readFileSync` to read the entire `sessions.json` file into memory during store hydration, leading to unbounded gateway memory growth and crash loops.
**Review Strategy:** Look for `fs.readFileSync` or monolithic parsing on unbounded state files (like `sessions.json`) and transition to lazy loading or streams.
