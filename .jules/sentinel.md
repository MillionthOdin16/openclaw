## 2024-05-18 - Execution Scanner Bypass via `node:` Prefix

**Vulnerability:** The security scanner (`src/security/skill-scanner.ts`) for identifying dangerous shell command execution (`dangerous-exec`) only searched for the literal string `child_process`. It could be bypassed by importing `exec` from `node:child_process` because the `requiresContext` regex `\bchild_process\b` did not match the `node:` prefix.
**Learning:** When scanning JavaScript/TypeScript code for built-in Node modules, always account for the `node:` protocol prefix which is commonly used and standard in modern Node.js versions.
**Prevention:** In regex-based static analysis for Node.js modules, always use an optional `node:` prefix matching pattern, e.g., `/(?:node:)?module_name/`.
