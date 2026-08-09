## 2026-03-09 - Command Injection in Keychain Access

**Vulnerability:** Found `execSync` used with template literal interpolation (`security find-generic-password -s "Codex Auth" -a "${account}" -w`) to retrieve keychain credentials in `src/agents/cli-credentials.ts`.
**Learning:** Even if the input variable (`account` or a service name) appears somewhat controlled, interpolating variables into a single shell command string passed to `execSync` is inherently vulnerable to command injection if an attacker can manipulate that input.
**Prevention:** Always use `execFileSync` instead of `execSync`, and pass the command and its arguments as an array of discrete strings rather than a single interpolated shell command string. This avoids shell interpretation of the arguments entirely.
