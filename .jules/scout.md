## 2026-03-20 - Discord Monitor Pattern
**Defect Pattern:** Discord API fetch failures (e.g., non-JSON 503s) resulting in unhandled promise rejections during bot registration or reconnection.
**Local Impact:** Triggers a gateway-wide fatal crash, affecting all agents and channels, instead of gracefully isolating the failure to the specific channel.
**Review Strategy:** Check for missing or incomplete `try/catch` blocks around `fetch` and `.json()` calls in the Discord monitor plugin (`src/discord/monitor`). Ensure errors are logged and not propagated to the process root.
