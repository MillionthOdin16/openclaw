## 2024-10-19 - Fix level directive extraction bug

**Learning:** When extracting directives like /think, the argument extraction logic did not differentiate between an argument provided with a colon (e.g., /think:on) and one provided with a space (e.g., /think hello). This caused "hello" to be incorrectly parsed as a level argument and removed from the message body, even though it was not a valid level.
**Action:** Implemented a testing improvement by creating a test file that exercises directive extraction. Fixed the extraction logic in src/auto-reply/reply/directives.ts to only consume space-separated arguments if they correspond to valid levels (as determined by the normalize function). Colon-separated arguments are always consumed.
