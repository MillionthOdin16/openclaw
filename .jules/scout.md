## 2026-02-19 - [Gateway] Pattern
**Defect Pattern:** Middleware ordering enforces global policies (like JWT auth) on namespaces reserved for plugins (`/api/channels/`), preventing flexible plugin behavior (public webhooks).
**Local Impact:** `src/gateway/server-http.ts` unconditionally blocks unauthenticated requests to `/api/channels/*`, breaking any plugin attempting to expose public endpoints there.
**Review Strategy:** Check `server-http.ts` routing logic when adding new public-facing plugin features.

## 2026-02-19 - [Agents] Pattern
**Defect Pattern:** Configuration merging logic in `resolveDefaultModelForAgent` relies on potentially unsafe object spreading of optional config sections, which may lead to dropped keys or incorrect fallbacks.
**Local Impact:** `src/agents/model-selection.ts` might be discarding agent-specific model settings if the default model config structure varies (string vs object).
**Review Strategy:** Verify `resolveDefaultModelForAgent` against all permutations of `defaults.model` (undefined, string, object) and `agents.list[].model` (string, object, empty object).
