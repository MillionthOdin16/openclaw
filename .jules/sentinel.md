## 2023-10-27 - Disable x-powered-by Header
**Vulnerability:** The Express `x-powered-by` header was enabled by default, which leaked information about the technology stack being used.
**Learning:** Default configurations for Express include the `x-powered-by` header which can aid attackers in reconnaissance.
**Prevention:** Always explicitly call `app.disable("x-powered-by")` on new Express application instances to avoid information leakage.
