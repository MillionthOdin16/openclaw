## 2026-07-22 - Session-Memory Hook Poisoning
**Vulnerability:** The session memory hook persisted raw chat-template control tokens (like `<|im_end|>`) and unparsed role markers into the `.md` memory files.
**Learning:** If unsanitized context is re-injected via `/new`, it creates a self-reinforcing poisoning loop that progressively degrades output into `NO_REPLY`.
**Prevention:** Always strip raw chat-template control tokens and unparsed role markers from agent outputs before persisting them to external memory files.
