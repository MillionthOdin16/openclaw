## 2024-05-24 - String Replace Performance

**Learning:** In the `src/utils.ts` utility file for this codebase, `shortenHomeInString` performs string replacement using `.split(display.home).join(display.prefix)`. The `split().join()` approach is significantly slower than using the native ES2021 `String.prototype.replaceAll` method.
**Action:** Replace `split().join()` string replacement patterns with `.replaceAll()` when a static string replacement is needed.
