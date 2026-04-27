## 2026-03-08 - Required Performance Optimization Comments

**Learning:** When making code optimizations as the Bolt persona, you must explicitly include comments explaining the optimization and why it was made directly in the code itself, not just in the PR description.
**Action:** Always add inline `// ⚡ Bolt Optimization: ` comments above your performance optimizations explaining the rationale (e.g. avoiding redundant memory allocations).
