## 2024-05-24 - Command Injection Risk in execSync Calls
**Vulnerability:** Use of string interpolation in `execSync` commands for fetching keychain credentials.
**Learning:** Even internal CLI commands like `security find-generic-password` are vulnerable to command injection or string quoting errors when user-controlled paths or variables (like `CODEX_HOME` used to compute `account`) are evaluated via shell.
**Prevention:** Prefer using `execFileSync` instead of `execSync` because it explicitly separates the executable from its arguments, preventing shell interpolation and command injection via malicious inputs.
