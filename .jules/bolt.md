## 2023-10-27 - Memoize extractToolCards

**Learning:** `extractToolCards` can be called repeatedly during UI rendering for the same message.
**Action:** Use a `WeakMap` to memoize the results keyed off the `message` object to prevent redundant parsing.

## 2023-10-27 - Memoize extractImages

**Learning:** `extractImages` can be called repeatedly during UI rendering for the same message.
**Action:** Use a `WeakMap` to memoize the results keyed off the `message` object to prevent redundant parsing.
