## 2024-05-18 - LINE Webhook Pattern
**Defect Pattern:** The webhook handlers (e.g., `src/line/webhook-node.ts` and `src/line/webhook.ts`) block the HTTP 200 response to LINE by awaiting slow LLM processing, causing message timeouts, false 429 errors, and reply token expiry.
**Local Impact:** Systematic message timeouts, duplicate message processing from LINE retries, and breaks the core messaging loop for the LINE channel.
**Review Strategy:** Check for other webhook handlers that `await` slow operations before returning HTTP 200.
