## 2024-09-01 - Disabled Express x-powered-by Header
**Vulnerability:** The application was using Express without disabling the 'x-powered-by' header.
**Learning:** This exposes technology stack information to clients, which can assist attackers in fingerprinting the server and tailoring exploits. New Express servers should always have `app.disable("x-powered-by")` explicitly called to prevent this leakage.
**Prevention:** Ensure `app.disable("x-powered-by")` is explicitly called when creating new Express server instances.
