## 2025-02-14 - schema-validator Pattern
**Defect Pattern:** Uncaught RangeError during JSON Schema validation compilation for deeply nested structures.
**Local Impact:** Can be used to crash the local application if maliciously crafted or deeply nested schema is supplied.
**Review Strategy:** Check for recursive JSON Schema object schemas.
