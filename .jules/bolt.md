## $(date +%Y-%m-%d) - Set instantiation inside loops
**Learning:** Instantiating a `new Set` inside a loop (like `map` or `filter`) can be worse than using `.includes()`, as it re-creates the Set (and iterates over the array) on every single loop iteration, resulting in O(N*M) or O(N*N) behavior and significant overhead.
**Action:** Always hoist `new Set()` instantiations outside of loops and `.filter()` or `.map()` callbacks to ensure they are created only once per pass.
