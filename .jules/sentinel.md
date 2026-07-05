## 2025-07-05 - Session-Memory Hook Poisoning
**Vulnerability:** The session-memory hook fails to strip raw chat-template control tokens (like <|im_end|>) from agent outputs before persisting them to memory files. When re-injected, this creates a poisoning loop.
**Learning:** Raw chat-template control tokens from agent outputs can be persisted into memory and cause prompt injection/poisoning on subsequent sessions.
**Prevention:** Always sanitize and strip chat-template control tokens (e.g., using regex `/<\|[a-z_]+\|>/gi`) before persisting LLM outputs to long-term memory.
