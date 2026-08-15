## 2026-08-15 - WhatsApp Web Pattern
**Defect Pattern:** The `lastDisconnect` error on close may be undefined or null from the Baileys library when a non-standard disconnect happens, leaving the underlying connection close without an error frame.
**Local Impact:** Rejecting the Baileys connection closure returns an undefined error or a non-Error object that is caught as a "Non-Error rejection", hiding the actual issue and failing the setup abruptly.
**Review Strategy:** When processing Baileys updates, always extract `.error` from `lastDisconnect` and fall back to a newly constructed `Error` if `lastDisconnect.error` or `lastDisconnect` is missing.
