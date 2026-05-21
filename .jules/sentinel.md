## 2026-03-09 - Prevent Command Injection via execSync in Keychain Reads

**Vulnerability:** The functions `readClaudeCliKeychainCredentials` and `readCodexKeychainCredentials` used `execSync` with shell interpolation.
**Learning:** The use of `execSync` in credential reads opens up risks for command injection when interpolating strings into the shell command, similar to an earlier issue fixed in writes (PR #20655).
**Prevention:** Always use `execFileSync` instead of `execSync` when running commands where arguments need to be properly escaped and shell evaluation should be prevented.
