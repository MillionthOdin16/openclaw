## 2025-02-27 - Node.js try/catch on missing files is slow
**Learning:** Using `fs.readFileSync` wrapped in a `try...catch` block to check for file existence across multiple paths is a performance bottleneck. The exception generation overhead is nearly 10x slower compared to validating existence via `fs.existsSync` first.
**Action:** When probing multiple potential file paths, use `fs.existsSync` to short-circuit rather than relying on `fs.readFileSync` throwing an error.
