## 2026-02-16 - Hooks Module Pattern
**Defect Pattern:** Command handling logic in hooks (specifically `session-memory`) often misses command variants or aliases (e.g., handling `/new` but missing `/reset`), leading to data loss or incomplete functionality.
**Local Impact:** Users relying on `/reset` to clear context will lose their session history in the memory archive, unlike those using `/new`. This inconsistency degrades the "Librarian" memory experience.
**Review Strategy:** Check all hook handlers in `src/hooks/bundled/` that listen for `command` events. Verify they handle all synonymous commands (e.g., `/new`, `/reset`, `/clear`) if the intent is similar.
