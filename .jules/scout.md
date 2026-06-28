## 2026-06-28 - Session Memory Poisoning Pattern

**Defect Pattern:** Session-memory hook fails to strip raw control tokens (like `<|im_end|>`) and unparsed role markers from agent outputs before persisting them to `.md` memory files. When re-injected via `/new`, it creates a self-reinforcing poisoning loop.
**Local Impact:** This poisoning loop progressively degrades agent output into `NO_REPLY` within our local fork.
**Review Strategy:** Double-check `src/hooks/bundled/session-memory/handler.ts` and related memory-persistence modules during future scans for token sanitization.

## 2026-06-28 - Chokidar FD Leak Pattern

**Defect Pattern:** Chokidar file watcher targeting specific files instead of directories holds persistent read-only file descriptors.
**Local Impact:** Causes linear FD exhaustion and memory bloating (event-loop starvation, silent cron failures) in our local environment over time (e.g., `src/agents/skills/refresh.ts`).
**Review Strategy:** Check file watcher logic (e.g., `src/agents/skills/refresh.ts`) during future scans to ensure watch targets use directories rather than individual files, or ensure FD lifecycle is properly bounded.

## 2026-06-28 - Unclosed FileHandle Pattern

**Defect Pattern:** `fs.FileHandle` objects are not properly closed via `try...finally` blocks on error or timeout paths.
**Local Impact:** Leads to memory leaks and fatal `ERR_INVALID_STATE` crashes on Node 24+ during garbage collection (e.g., `src/agents/session-write-lock.ts`).
**Review Strategy:** Review file access patterns (e.g., in `src/agents/session-write-lock.ts`) and ensure `handle.close()` is always called in a `finally` block or successfully managed.
