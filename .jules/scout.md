## 2026-06-25 - [agents] Pattern

**Defect Pattern:** Unclosed `fs.FileHandle` objects during initialization errors and timeout paths causing Node 24+ fatal crashes.
**Local Impact:** Crash loop under Node.js v25 during session agent initialization.
**Review Strategy:** Check for proper `try...finally` usage around any code acquiring `fs.FileHandle` locks in `src/agents/session-write-lock.ts`.

## 2026-06-25 - [config/sessions] Pattern

**Defect Pattern:** Unbounded file reads of potentially massive `.json` files into process memory causing OOM (e.g., using `fs.readFileSync`).
**Local Impact:** Gateway process repeatedly crashes with out-of-memory errors on restart loops when stores grow to gigabytes.
**Review Strategy:** Replace direct `fs.readFileSync` calls for store loading with streaming, chunked, or memory-bound read implementations.

## 2026-06-25 - [agents/skills] Pattern

**Defect Pattern:** Chokidar `awaitWriteFinish` causing severe CPU usage and FD leaks when watching targeted files instead of directories.
**Local Impact:** High idle CPU and event loop freezing on macOS deployments due to aggressive `stat` polling.
**Review Strategy:** Ensure watch targets use directories rather than individual files, and evaluate if `awaitWriteFinish` is strictly necessary.
