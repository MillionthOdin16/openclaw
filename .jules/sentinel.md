## 2025-01-16 - Prevent Shell Injection in macOS Keychain Interactions

**Vulnerability:** Command execution using `execSync` with `security find-generic-password` allowed shell interpretation of arguments.
**Learning:** Even when inputs are partially sanitized or hashed, using `execSync` introduces shell injection risks if an attacker controls input like `codexHome`.
**Prevention:** Always use `execFileSync` (which skips the shell) for invoking system utilities like `security`, passing arguments safely as an array.
