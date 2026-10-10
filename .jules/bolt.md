## 2024-05-24 - Optimize array filter conditions
**Learning:** Moving constant condition checks outside of array loop iteration callbacks (like "filter") significantly reduces execution overhead when the condition evaluates false and the array is returned unmodified, especially on larger arrays.
**Action:** Avoid placing conditions that don't depend on the loop item directly inside the iteration callback.
