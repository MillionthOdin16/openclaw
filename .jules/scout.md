## 2024-05-28 - ChatRunRegistry Pattern

**Defect Pattern:** The lack of TTL/timeout garbage collection in `ChatRunRegistry` (and related state tracking maps like `chatRunSessions`) causes unbounded memory leaks and gateway OOM crashes during heavy load or when agents hang.
**Local Impact:** Can lead to out-of-memory errors on our gateway if an agent hangs for too long, impacting production stability and causing potential data loss due to missed cleanups.
**Review Strategy:** When exploring gateway routing and state maps, always verify whether maps that track sessions or state have a proper cleanup mechanism, such as TTL timeouts or periodic cleanup, to prevent memory leaks.

## 2024-05-28 - LINE Webhook Pattern

**Defect Pattern:** The `LINE Webhook` defect pattern occurs where webhook handlers await slow LLM processing, blocking the HTTP 200 response to LINE. This causes message timeouts, false 429 errors, and reply token expiry.
**Local Impact:** Can cause LINE integration failures, preventing bot responses to user messages.
**Review Strategy:** Check webhook implementations (e.g. `src/line/webhook-node.ts` and `src/line/webhook.ts`) to ensure that `await params.bot.handleWebhook(body);` or similar processing is not blocking the HTTP response. The system should acknowledge the webhook immediately and process the event asynchronously.
