## 2026-04-12 - LINE Webhook Pattern

**Defect Pattern:** Blocking HTTP 200 responses on slow LLM processing.
**Local Impact:** Webhook replies time out, causing missing messages.
**Review Strategy:** Check webhook handlers (e.g., `src/line/webhook.ts`, `src/line/webhook-node.ts`) for `await` calls that block the HTTP response.
