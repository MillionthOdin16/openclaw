## 2025-01-23 - Insecure Random Number Generation

**Vulnerability:** Weak random number generation (`Math.random()`) used for Session Slugs.
**Learning:** `Math.random()` provides cryptographically insecure randomness, which is inadequate for identifying sessions uniquely and securely. An attacker could potentially predict session identifiers if they are exposed and are used securely in references.
**Prevention:** Always use cryptographically secure random number generators like `node:crypto`'s `randomInt` or `randomBytes` for identifiers, keys, and tokens.
