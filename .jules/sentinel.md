## 2025-01-01 - Express Server Header Leakage
**Vulnerability:** Express app instances were leaking technology stack information via the 'X-Powered-By' HTTP header.
**Learning:** By default, Express includes this header. If left active, attackers could use this information to specifically target vulnerabilities in Express or Node.js.
**Prevention:** Always explicitly call app.disable('x-powered-by') when creating new Express application instances to prevent this leakage.
