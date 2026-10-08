## 2026-03-09 - Parallelize array element mapping in sanitizeSessionMessagesImages
**Learning:** In `src/agents/pi-embedded-helpers/images.ts`, we iterate sequentially over an array `sanitizedIds`, awaiting potentially expensive `sanitizeContentBlocksImages` calls one by one. This happens whenever images are sanitized in messages before interacting with the LLM API.
**Action:** Replace sequential `for...of` loops involving independent `await` calls with `await Promise.all(array.map(...))` to improve processing latency, especially when processing many tool results/messages at once.
