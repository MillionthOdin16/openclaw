## 2024-05-15 - Disable x-powered-by Header
**Vulnerability:** Express apps expose technology stack info by default via the 'x-powered-by: Express' HTTP header, allowing attackers to tailor their attacks to the specific stack.
**Learning:** Found multiple Express app instantiations missing `app.disable('x-powered-by')`. This is a common and easy-to-miss security gap.
**Prevention:** In the future, ensure all new Express instances explicitly call `app.disable('x-powered-by')` immediately after initialization, or use a global middleware/configuration to strip it.
