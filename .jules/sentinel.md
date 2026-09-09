## 2024-05-18 - Express app 'x-powered-by' header leakage
**Vulnerability:** Express apps expose the 'x-powered-by' header by default, revealing the technology stack to potential attackers.
**Learning:** Default configurations in frameworks often include headers or identifiers that leak implementation details.
**Prevention:** Explicitly disable unnecessary headers like 'x-powered-by' using `app.disable('x-powered-by')` when setting up new Express applications.
