## 2023-10-27 - [MEDIUM] Fix express x-powered-by header leakage
**Vulnerability:** Express `x-powered-by` header leaks technology stack information, which can be used by attackers to identify vulnerabilities specific to the Express framework or Node.js.
**Learning:** `express()` instances were created without explicitly disabling the `x-powered-by` header across the codebase (e.g. browser and media servers).
**Prevention:** Always explicitly call `app.disable('x-powered-by')` when creating new Express application instances to prevent technology stack information leakage via HTTP headers.
