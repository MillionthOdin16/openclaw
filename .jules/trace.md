## 2024-03-08 - Adding test coverage for core utilities
**Learning:**
Adding test suites to critical underlying utility functions (like boolean parsing and json stringifying) guarantees stability for higher-level modules. We found "parseBooleanValue" allows overriding truthy or falsy separately, and "safeJsonStringify" has good custom handling for Error, BigInt and Uint8Array that requires exact test assertions.
**Action:**
We added "chunk-items.test.ts", "boolean.test.ts", and "safe-json.test.ts" to "src/utils" which significantly increases coverage on utilities and protects them against regression.
