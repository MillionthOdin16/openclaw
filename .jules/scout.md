## 2024-05-19 - Compaction Engine Pattern
**Defect Pattern:** The `ContextEngine.compact()` plugin-owned function is called unbounded (no timeout, no watchdog, no abort signal) in multiple places, leading to event loop starvation and agent hangs when the compaction engine takes too long.
**Local Impact:** This bug causes the agent to become entirely unresponsive if a plugin `compact()` call hangs (e.g. rate-limited model or unbound loop), as no timeout protects the caller (such as the pi-embedded runner or codex harness).
**Review Strategy:** When adding or auditing compaction operations (like `contextEngine.compact`), ensure they are wrapped in a safety timeout like `compactWithSafetyTimeout` and thread abort signals correctly if available.
