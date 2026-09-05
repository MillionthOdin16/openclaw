## 2024-05-24 - Disable x-powered-by header in Express apps

**Vulnerability:** Express apps expose the x-powered-by: Express header by default, which can leak technology stack information to potential attackers.
**Learning:** It is a good practice to always disable x-powered-by when instantiating new Express applications to prevent information disclosure.
**Prevention:** Use app.disable("x-powered-by"); immediately after creating an Express app instance.
