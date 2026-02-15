## 2026-02-12 - [Voice Call] Pattern
**Defect Pattern:** Insecure default configurations in media streaming extensions.
**Local Impact:** The `voice-call` extension enabled WebSocket media streams for all providers if `streaming.enabled` was true, but only enforced token validation for `twilio`. This left other providers (like `mock` or future `telnyx`/`plivo` implementations) vulnerable to unauthorized stream access if a `callId` was known.
**Review Strategy:** Check all `WebSocket` upgrade handlers and `connection` event listeners for robust authentication and origin validation, especially in extensions that implement their own servers.
