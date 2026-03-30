🦅 Scout: Critical Inherited Defect Report - 2024-05-24

1. **Upstream Issue #55606: Discord health-monitor: excessive stale-socket reconnects causing memory leak → OOM**
   - **Location in our code:** `src/gateway/channel-health-monitor.ts` lines 106-133, `src/gateway/channel-health-policy.ts` lines 86-97
   - **Observed Behavior:** The `channel-health-monitor` improperly evaluates `stale-socket` on stable Discord connections. Over 18 hours, it restarts the connection dozens of times (e.g., 40x), leaking memory until the process hits the JavaScript heap limit and crashes.
   - **Expected Behavior:** The monitor should properly evaluate socket health on channels like Discord to avoid aggressive `stale-socket` restarts, and reconnects should not leak memory.
   - **Impact Severity:** HIGH. Core agent gateway process crashes after ~18h of uptime due to an OOM fatal error.

2. **Upstream Issue #51264: OOM crash: loadCombinedSessionStoreForGateway loads all agent session stores simultaneously**
   - **Location in our code:** `src/gateway/session-utils.ts` lines 565-606 (specifically `loadCombinedSessionStoreForGateway`)
   - **Observed Behavior:** The function eagerly loops over all agents and loads _every_ agent's full `sessions.json` simultaneously. With multiple agents and large session stores, this allocates a massive amount of memory when resolving a hook dispatch.
   - **Expected Behavior:** `loadCombinedSessionStoreForGateway` shouldn't be used when resolving individual agent requests. We should load only the specific target agent's session file lazily or use pagination.
   - **Impact Severity:** HIGH. Process hits Node.js heap limits and crashes with `FATAL ERROR: Reached heap limit Allocation failed` under moderate multi-agent load.
