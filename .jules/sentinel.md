## 2025-07-03 - Fix Command Injection in CLI Credentials
**Vulnerability:** The CLI credentials reader used `execSync` with string interpolation for `security find-generic-password`, which could allow arbitrary command execution via maliciously crafted arguments.
**Learning:** Shell interpreters evaluate characters like backticks and `$(...)` in strings passed to `execSync`.
**Prevention:** Use `execFileSync` and pass arguments as an array instead of a single string.
