## 2023-10-25 - Dynamic code execution via setTimeout/setInterval string arguments
**Vulnerability:** The code scanner was failing to detect `setTimeout` and `setInterval` when used with a string as the first argument, which acts identically to `eval` in JS environments.
**Learning:** `setTimeout` and `setInterval` should always be treated as potential dynamic execution vectors, exactly like `eval` and `new Function`, if they are called with string literals.
**Prevention:** Ensured the rule regex includes `setTimeout` and `setInterval` followed by string quote characters.
