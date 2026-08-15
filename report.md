🦅 Scout: Critical Inherited Defect Report - 2026-08-15

- **Upstream Issue 115436**: WhatsApp Web login: Non-Error rejection / WebSocket connection ended before fully opening
  - **Local File Path & Line Numbers**: `src/web/session.ts` lines 176-179
  - **Expected Behavior**: When the connection closes prematurely, the process should gracefully reject with a properly instantiated `Error` object that contains a descriptive message, avoiding a generic "Non-Error rejection".
  - **Observed Behavior**: The Baileys library returns an update where `connection === "close"`, but `lastDisconnect` is either undefined or an object containing an undefined `error`. The code calls `reject(update.lastDisconnect ?? new Error("Connection closed"));`, which passes an object that is not an `Error` instance (or is undefined), resulting in a "Non-Error rejection" bubble-up and crashing the channel login.
  - **Impact Severity**: High - Blocks WhatsApp channel setup and reconnection entirely on macOS/Windows setups affected by the protocol termination issue.
