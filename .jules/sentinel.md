## 2026-08-23 - Scanner Bypass for Dynamic Code Execution
**Vulnerability:** The skill-scanner regex only checked for `new Function(`, missing the invocation of `Function(` without the `new` keyword, which executes code dynamically and can bypass security checks.
**Learning:** In JavaScript, the `Function` constructor can be invoked with or without the `new` keyword to create and evaluate dynamic code. Regex-based code scanners must account for both patterns.
**Prevention:** Update the regex for `dynamic-code-execution` to use an optional non-capturing group for the `new` keyword `\b(?:new\s+)?Function\s*\(`.
