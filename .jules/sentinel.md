## 2025-02-05 - Fix Session-Memory Hook Poisoning
**Vulnerability:** Raw chat-template control tokens (like `<|im_start|>` and `<|im_end|>`) were being captured in the `session-memory` hook without sanitization.
**Learning:** These tokens could create a self-reinforcing prompt-poisoning loop, degrading agent output into `NO_REPLY`.
**Prevention:** Always sanitize context of raw model control tokens before persisting them back into context to be injected via `/new`.
