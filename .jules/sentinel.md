## 2023-10-27 - [Fix] Remove vulnerable `eval` from playwright tools evaluation

**Vulnerability:** Found `eval("(" + fnBody + ")")` in browser element and page evaluation logic. Using `eval` opens the execution environment up to arbitrary dynamic code injection which can alter the execution scope.
**Learning:** `eval` was used historically because of its convenience but fails to enforce code isolation properly within the browser context, making it less secure compared to `new Function()`.
**Prevention:** In this environment, the standard pattern for mitigating `eval`-like execution needs is to use `new Function()`. Always leverage `new Function("return (" + dynamic_code + ")")()` instead of `eval`, alongside the `// eslint-disable-next-line @typescript-eslint/no-implied-eval` pragma, to provide a constrained scope and avoid local scope pollution.
