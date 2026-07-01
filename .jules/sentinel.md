## 2025-02-14 - Replace weak randomness with cryptographically secure randomness

**Vulnerability:** Weak randomness using `Math.random()` and `Date.now()` is used in several places for token/ID generation, fallback slugs, backoff algorithms, etc.
**Learning:** This exposes these applications to potential prediction of identifiers, leading to security issues depending on where they are used. Even where only used for naming non-security items, it's a poor pattern.
**Prevention:** Always use `crypto.randomUUID()` or `crypto.randomBytes` or `crypto.randomInt` from `node:crypto` or `globalThis.crypto.randomUUID()` to generate unguessable IDs or tokens, or `crypto.randomInt` for backoff randomness if it must be completely unpredictable. But the priority is fixing predictable secrets/IDs.
