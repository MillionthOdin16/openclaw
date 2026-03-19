## 2024-05-24 - manual loops vs map().join() and `undefined` handling

**Learning:** When optimizing hot-path serialization loops by replacing `.map().join(',')` with manual string concatenation (`+=`), it is critical to handle `undefined` properly. `Array.prototype.join()` coerces `undefined` to `""`, whereas standard string concatenation stringifies it as `"undefined"`, which silently corrupts stable hashes for recursive data structures.
**Action:** Always test loop replacements rigorously against edge cases (like arrays with `undefined` elements or function types) and use `result += item === undefined ? "" : item` where necessary. Also, ensure curly braces are used for all `if` statements to pass `eslint(curly)`.
