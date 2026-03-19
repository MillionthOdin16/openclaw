🦅 Scout: Critical Inherited Defect Report - 2026-03-20

*   **Upstream Issue:** [#44529](https://github.com/openclaw/openclaw/issues/44529) "Gateway crashes with unhandled promise rejection when Discord API returns 503 during health-monitor bot reconnect"
*   **Local File Path & Line Numbers:** `src/discord/monitor/gateway-plugin.ts`, lines 59-72
*   **Expected Behavior:** The `registerClient` method should catch parsing errors (e.g., from `response.json()`) when the Discord API returns a non-JSON error like a 503, preventing the error from propagating as an unhandled promise rejection and crashing the Node.js process.
*   **Observed Behavior:** If the Discord API returns a 503 with a non-JSON body, the call to `response.json()` throws an error that bypasses the outer `try/catch` block, causing an unhandled promise rejection and crashing the entire gateway process.
*   **Impact Severity:** High. A failure on a single Discord channel connection during reconnect will crash the entire gateway process, taking all agents and all other channels offline.
