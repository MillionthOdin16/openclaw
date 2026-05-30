## $(date +%Y-%m-%d) - Native Array.prototype.sort is faster than custom merge sort

**Learning:** Re-implementing sorting logic in Javascript (like a custom merge sort with array buffering) is almost always slower than leveraging `Array.prototype.sort()`. V8's native sort algorithms (like Timsort) are heavily optimized in C++ and out-perform JS-space loop iterations, array allocation overhead, and multiple function calls even for relatively small arrays. V8 uses a stable sort for `Array.prototype.sort()` since Node 11 / ES2019.

**Action:** Whenever a custom sorting function like `mergeSort` is found and doesn't serve an incredibly unique, non-comparable requirement, replace it with `Array.from(values).sort((a, b) => a.localeCompare(b))` (or similar native comparator) for significant performance and readability improvements.
