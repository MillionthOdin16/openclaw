## 2024-05-24 - Command Injection in Keychain Reading
**Vulnerability:** Command injection in `src/agents/cli-credentials.ts` via string interpolation of a potentially untrusted input (`account` derived from `process.env.CODEX_HOME`) into `execSync`.
**Learning:** Using `execSync` with a full command string is vulnerable if any part of that string can be influenced by the user or environment. Even if the variable seems constrained, it violates defense-in-depth principles.
**Prevention:** Always use `execFileSync` (or `execFile`, `spawn`) with the arguments passed as an array. This ensures the arguments are passed directly to the executable without going through a shell, preventing shell injection completely.
