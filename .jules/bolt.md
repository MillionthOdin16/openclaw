## 2024-05-20 - Grouped Render Performance Optimization
**Learning:** Adding memoization using WeakMap for extracting images and tool cards from chat messages prevents unnecessary re-computation during frequent UI re-renders, significantly improving frontend performance.
**Action:** Use WeakMap to cache expensive parsing operations like `extractImages` and `extractToolCards` based on the raw message object to avoid redundant work and maintain referential equality.
