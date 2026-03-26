## 2026-03-24 - [Discord Monitor] Pattern
**Defect Pattern:** Uncaught exceptions during forced disconnection/reconnection paths (e.g. `gateway.disconnect()` while `maxAttempts` is set to 0).
**Local Impact:** Gateway process crashes and disrupts all agent sessions.
**Review Strategy:** Review WebSocket and gateway plugin abstraction code, especially lifecycle stopping mechanisms that manipulate reconnection configurations on teardown.

## 2026-03-24 - [Subagent Runtime] Pattern
**Defect Pattern:** Default timeout values failing to apply because parameter initialization falls back to `0` instead of `undefined`, which the timeout resolver misinterprets as an explicit "disable timeout" instruction.
**Local Impact:** Subagents spawned without an explicit timeout run indefinitely, consuming system resources.
**Review Strategy:** Review default parameter fallback logic in subagent registration/spawning and ensure `undefined` is used to trigger inherited default resolution logic.

## 2026-03-24 - [Provider Integration] Pattern
**Defect Pattern:** Third-party providers (like Kimi via OpenAI/Anthropic compat) failing to correctly serialize/send tool parameters, causing validation failures where the agent's intent is lost.
**Local Impact:** Tools with required parameters fail constantly when using specific providers, blocking task completion.
**Review Strategy:** Review provider adapter layer and parameter serialization code, especially how `{}` empty parameter maps are parsed from provider-specific JSON wire formats.
