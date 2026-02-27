import { describe, expect, it } from "vitest";
import { ResizableDivider } from "./resizable-divider.ts";
import { parseHTML } from "linkedom";

// Setup minimal DOM for LinkeDOM
const dom = parseHTML(`<!doctype html><html><body></body></html>`);
const { document, customElements, HTMLElement, Event, CustomEvent, KeyboardEvent, MutationObserver } = dom;

// Polyfill global environment for Lit
(global as any).document = document;
(global as any).HTMLElement = HTMLElement;
(global as any).Event = Event;
(global as any).CustomEvent = CustomEvent;
if (typeof KeyboardEvent === 'undefined' || typeof KeyboardEvent !== 'function') {
    class MockKeyboardEvent extends Event {
        key: string;
        constructor(type: string, init: any) {
            super(type, init);
            this.key = init.key || "";
        }
    }
    (global as any).KeyboardEvent = MockKeyboardEvent;
} else {
    (global as any).KeyboardEvent = KeyboardEvent;
}
(global as any).MutationObserver = MutationObserver;
(global as any).window = document.defaultView;

// Monkey-patch createComment for Lit
if (!(document as any).createComment) {
    (document as any).createComment = (data: string) => document.createTextNode(`<!--${data}-->`);
}

// Monkey-patch the class for testing purposes
class TestResizableDivider extends ResizableDivider {
  createRenderRoot() {
    return this;
  }
}

// Register custom element
if (!customElements.get("resizable-divider")) {
  customElements.define("resizable-divider", TestResizableDivider);
}

describe("ResizableDivider Accessibility", () => {
  it("renders with correct accessibility attributes", () => {
    const divider = new TestResizableDivider();

    try {
        document.body.appendChild(divider);
    } catch (e) {
        if (divider.connectedCallback) divider.connectedCallback();
    }

    expect(divider.getAttribute("role")).toBe("separator");
    expect(divider.getAttribute("tabindex")).toBe("0");
    // Default orientation
    expect(divider.getAttribute("aria-orientation")).toBe("vertical");
    // Default label (set if missing)
    expect(divider.getAttribute("aria-label")).toBe("Resize");

    divider.splitRatio = 0.5;
    divider.minRatio = 0.2;
    divider.maxRatio = 0.8;
    divider.label = "Custom Label";

    // Manually trigger update
    // @ts-ignore
    if (typeof divider.updated === 'function') {
        // @ts-ignore
        divider.updated(new Map([['splitRatio', 0], ['label', 'Resize']]));
    }

    expect(divider.getAttribute("aria-valuenow")).toBe("0.5");
    expect(divider.getAttribute("aria-valuemin")).toBe("0.2");
    expect(divider.getAttribute("aria-valuemax")).toBe("0.8");
    expect(divider.getAttribute("aria-label")).toBe("Custom Label");
  });

  it("handles keyboard interaction", () => {
    const divider = new TestResizableDivider();
    try {
        document.body.appendChild(divider);
    } catch (e) {
        if (divider.connectedCallback) divider.connectedCallback();
    }

    divider.splitRatio = 0.5;

    let lastRatio: number | null = null;
    divider.addEventListener("resize", (e: any) => {
      lastRatio = e.detail.splitRatio;
    });

    const KEvent = (global as any).KeyboardEvent;

    // Simulate ArrowLeft
    const leftEvent = new KEvent("keydown", { key: "ArrowLeft", bubbles: true });
    divider.dispatchEvent(leftEvent);

    expect(lastRatio).toBeCloseTo(0.45);

    // Simulate ArrowRight
    const rightEvent = new KEvent("keydown", { key: "ArrowRight", bubbles: true });
    divider.dispatchEvent(rightEvent);

    expect(lastRatio).toBeCloseTo(0.55);
  });
});
