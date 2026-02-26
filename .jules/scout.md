## 2026-02-26 - Telegram Network Pattern
**Defect Pattern:** Global State Mutation in Channel Plugins
**Local Impact:** `src/telegram/fetch.ts` calls `setGlobalDispatcher`, breaking connectivity for the entire application when proxies are used.
**Review Strategy:** Audit all channel plugins (Telegram, WhatsApp, etc.) for `undici` global modifications.
