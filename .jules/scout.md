## 2024-05-24 - LINE Webhook Pattern
**Defect Pattern:** LINE webhook handlers block the HTTP 200 response by awaiting slow LLM processing, causing timeouts, fake 429s, and reply token expiry.
**Local Impact:** `src/line/webhook-node.ts` and `src/line/webhook.ts` both await `handleWebhook` or `onEvents` before sending the 200 OK response.
**Review Strategy:** Check for blocking awaits in webhook response paths.
