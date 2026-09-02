## 2024-05-18 - Prevent Information Leakage via HTTP Headers

**Vulnerability:** Express apps were created without explicitly disabling the x-powered-by header, potentially leaking technology stack information.
**Learning:** We need to call app.disable('x-powered-by') when creating Express apps to avoid information leakage.
**Prevention:** Always call app.disable('x-powered-by') immediately after instantiating an Express app.
