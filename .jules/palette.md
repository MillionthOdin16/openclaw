## 2026-02-20 - Manual Form Field Construction
**Learning:** The application currently constructs form fields by manually pairing labels, inputs, and helper/error text with inline styles and attributes. This leads to inconsistent accessibility (e.g., missing `aria-describedby`) and duplicated logic.
**Action:** Identify or create a reusable `FormField` component that automatically generates unique IDs and wires up `aria-describedby`, `aria-invalid`, and associated helper/error text to reduce boilerplate and ensure accessibility by default.
