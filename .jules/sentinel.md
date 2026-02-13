## 2026-02-13 - [Timing Attack in Bridge Server Auth]
**Vulnerability:** The browser bridge server used a direct string comparison (`auth === "Bearer " + token`) for authentication, which is vulnerable to timing attacks.
**Learning:** Even internal control servers should use constant-time comparisons for secrets to prevent side-channel leaks. Security libraries like `crypto.timingSafeEqual` (via `safeEqualSecret`) are critical.
**Prevention:** Always use `safeEqualSecret` or `crypto.timingSafeEqual` when comparing user-provided secrets against stored secrets.
