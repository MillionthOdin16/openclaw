# 🦅 Scout: Critical Inherited Defect Report - 2026-02-12

## Summary of Legitimate Bugs

### 1. **Voice Call Extension: Unauthorized Media Stream Access (Non-Twilio Providers)**
* **Location in our code:** `extensions/voice-call/src/webhook.ts` lines 87-95.
* **Observed Behavior:** The media stream WebSocket endpoint (`/voice/stream`) accepted connections for any valid `callId` without authentication if the provider was not `twilio`. This allowed unauthorized access to bidirectional audio streams (hijacking) if `streaming.enabled` was true and a non-Twilio provider (e.g., `mock`, `telnyx`) was configured.
* **Expected Behavior:** The system should reject media stream connections for providers that do not support secure authentication (token validation) or explicitly enforce it.
* **Impact Severity:** **High** (Audio stream hijacking, potential cost injection via STT usage).
* **Status:** **Fixed** locally by blocking non-Twilio providers in `shouldAcceptStream`.

### 2. **Gateway URL Injection (CVE-2026-25253)**
* **Location in our code:** `ui/src/ui/app-settings.ts` and `ui/src/ui/app.ts`.
* **Verification:** Confirmed that our local codebase **already contains the fix**. The application correctly queues the `gatewayUrl` change (`pendingGatewayUrl`) and requires user confirmation via a dialog before connecting, preventing the auto-connect RCE vulnerability.
