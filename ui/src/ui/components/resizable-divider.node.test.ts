import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseHTML } from "linkedom";

// Setup global DOM environment
const dom = parseHTML(`<!DOCTYPE html><html><body></body></html>`);
const { window, document, customElements, HTMLElement, Event, CustomEvent } = dom;

// Polyfill globals for Lit
vi.stubGlobal("window", window);
vi.stubGlobal("document", document);
vi.stubGlobal("customElements", customElements);
vi.stubGlobal("HTMLElement", HTMLElement);
vi.stubGlobal("Event", Event);
vi.stubGlobal("CustomEvent", CustomEvent);
// linkedom might not export KeyboardEvent directly, use window.KeyboardEvent or a mock
vi.stubGlobal("KeyboardEvent", window.KeyboardEvent || class KeyboardEvent extends Event {
  key: string;
  constructor(type: string, init?: KeyboardEventInit) {
    super(type, init);
    this.key = init?.key || "";
  }
});
vi.stubGlobal("requestAnimationFrame", (cb: () => void) => setTimeout(cb, 0));
vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));

// Import component AFTER setting up globals
// Using dynamic import to ensure globals are set
const { ResizableDivider } = await import("./resizable-divider.js");

describe("ResizableDivider Accessibility (Node)", () => {
  let element: InstanceType<typeof ResizableDivider>;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    // Mock getBoundingClientRect
    container.getBoundingClientRect = () => ({ width: 1000, height: 500, top: 0, left: 0, right: 1000, bottom: 500 } as DOMRect);
    document.body.appendChild(container);

    // Create element
    // Note: linkedom might not automatically upgrade custom elements created via createElement unless defined before?
    // Usually document.createElement works if customElements.define was called.
    element = document.createElement("resizable-divider");
    container.appendChild(element);

    // Manually trigger connectedCallback if needed in linkedom?
    // linkedom should call connectedCallback when appended.
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should have correct accessibility attributes", async () => {
    // Wait for element update cycle
    await element.updateComplete;

    expect(element.getAttribute("role")).toBe("separator");
    expect(element.getAttribute("aria-orientation")).toBe("vertical");
    expect(element.getAttribute("tabindex")).toBe("0");

    // Check initial values
    expect(element.getAttribute("aria-valuenow")).toBe("60"); // 0.6 * 100
    expect(element.getAttribute("aria-valuemin")).toBe("40"); // 0.4 * 100
    expect(element.getAttribute("aria-valuemax")).toBe("70"); // 0.7 * 100
  });

  it("should update aria-valuenow when splitRatio changes", async () => {
    element.splitRatio = 0.5;
    await element.updateComplete;
    expect(element.getAttribute("aria-valuenow")).toBe("50");
  });

  it("should respond to keyboard events", async () => {
    const resizeSpy = vi.fn();
    element.addEventListener("resize", resizeSpy);

    await element.updateComplete;

    // Mock focus method (linkedom might support it but let's be safe)
    if (!element.focus) {
        element.focus = () => {};
    }
    element.focus();

    // Simulate ArrowLeft
    const event = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true });
    element.dispatchEvent(event);
    await element.updateComplete;

    expect(resizeSpy).toHaveBeenCalled();
    const customEvent = resizeSpy.mock.calls[0][0] as CustomEvent;
    expect(customEvent.detail.splitRatio).toBeLessThan(0.6); // Should decrease
  });
});
