## 2026-02-18 - [Hooks] Pattern
**Defect Pattern:** Internal hooks often rely on `DEFAULT_PROVIDER` / `DEFAULT_MODEL` constants instead of resolving the active agent's configuration.
**Local Impact:** Features like `session-memory` (slug generation) fail for users using non-Anthropic providers, as the fallback defaults to Anthropic.
**Review Strategy:** Scan other hook implementations (e.g., `src/hooks/bundled/`) for direct usage of `DEFAULT_PROVIDER` or missing `resolveAgentModelPrimary` calls.
