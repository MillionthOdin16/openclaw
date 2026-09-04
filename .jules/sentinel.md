## 2024-09-04 - Fix technology stack information leakage via Express x-powered-by header
**Vulnerability:** Express apps were created without disabling the x-powered-by header, which defaults to true. This leaks information about the application technology stack (i.e. 'Express') via HTTP response headers.
**Learning:** In this application architecture, new Express application instances must explicitly call app.disable('x-powered-by') right after creation to prevent technology stack footprinting by attackers.
**Prevention:** Always explicitly disable x-powered-by on newly instantiated express() apps.
