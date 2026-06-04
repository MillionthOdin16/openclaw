## 2026-06-04 - Compaction Engine Pattern

**Defect Pattern:** Unbounded operations (like plugin-owned `ContextEngine.compact()`) without safety timeouts, watchdogs, or abort signals.
**Local Impact:** Event loop starvation and indefinite embedded agent hangs during context auto-compaction.
**Review Strategy:** Check `src/agents/pi-embedded-runner/run.ts`, `src/agents/pi-embedded-runner/compact.ts`, and anywhere ContextEngine methods are invoked for missing `compactWithSafetyTimeout` wrappers.
