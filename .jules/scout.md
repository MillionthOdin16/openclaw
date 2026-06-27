## 2026-06-26 - [session-memory hook] Pattern

**Defect Pattern:** The session-memory hook captures raw chat-template tokens (like `<|im_end|>`) leaked into the content stream by provider parsers, saving them verbatim into `.md` memory files. When re-injected via `/new`, it acts as a self-reinforcing poisoning loop where the model mimics the injected tokens.
**Local Impact:** Progressively corrupts quantized local model integrations and heartbeat-driven chat agents in our fork, causing cascading NO_REPLY or role-token duplication loops.
**Review Strategy:** Check `src/hooks/bundled/session-memory/handler.ts` (specifically `getRecentSessionContent`) for absent token stripping/sanitization logic before persisting agent outputs.
