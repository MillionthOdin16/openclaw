## 2025-02-23 - Command Injection Prevention in CLI Credentials

**Vulnerability:** Command injection risk when using `execSync` with dynamically interpolated strings to read credentials from the keychain.
**Learning:** `execSync` executes a command in a shell environment by default, which means shell metacharacters and interpolation can be abused if any input to the command string is user-controlled or not properly validated.
**Prevention:** Use `execFileSync` instead. It bypasses the shell by taking the executable name and an array of arguments separately, mitigating command injection vulnerabilities.
