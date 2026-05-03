## 2026-05-03 - Gateway Session Store Pattern
**Defect Pattern:** Eagerly loading unbounded JSON files (`sessions.json`) into memory unconditionally across all configured agents causes severe V8 heap exhaustion and OOM crashes during concurrent requests or polling.
**Local Impact:** Functions like `loadCombinedSessionStoreForGateway` and `writeSessionStoreCache` duplicate agent memory (JSON string, parsed object, multiple `structuredClone`s), crashing our local instances when 10+ agents handle large workloads.
**Review Strategy:** Review `src/gateway/session-utils.ts`, `src/gateway/sessions-resolve.ts`, and associated hook functions. Replace unconditional full-store loading with lazy, targeted loading (e.g. `loadSessionStoreForAgent`) and eliminate duplicate clones.
