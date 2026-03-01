import { LitElement, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * A draggable divider for resizable split views.
 * Dispatches 'resize' events with { splitRatio: number } detail.
 */
@customElement("resizable-divider")
export class ResizableDivider extends LitElement {
  @property({ type: Number }) splitRatio = 0.6;
  @property({ type: Number }) minRatio = 0.4;
  @property({ type: Number }) maxRatio = 0.7;
  @property({ type: String }) orientation: "horizontal" | "vertical" = "vertical";
  @property({ type: String }) label = "Resize";

  private isDragging = false;
  private startX = 0;
  private startRatio = 0;

  static styles = css`
    :host {
      width: 4px;
      cursor: col-resize;
      background: var(--border, #333);
      transition: background 150ms ease-out;
      flex-shrink: 0;
      position: relative;
      outline: none;
    }
    :host([orientation="horizontal"]) {
      width: auto;
      height: 4px;
      cursor: row-resize;
    }
    :host(:focus-visible) {
      background: var(--accent, #007bff);
      box-shadow: 0 0 0 2px var(--focus-ring, rgba(0, 123, 255, 0.5));
    }
    :host::before {
      content: "";
      position: absolute;
      top: 0;
      left: -4px;
      right: -4px;
      bottom: 0;
    }
    :host(:hover) {
      background: var(--accent, #007bff);
    }
    :host(.dragging) {
      background: var(--accent, #007bff);
    }
  `;

  render() {
    return nothing;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "separator");
    this.setAttribute("tabindex", "0");
    this.setAttribute("aria-orientation", this.orientation);
    this.setAttribute("aria-label", this.label);
    this.addEventListener("mousedown", this.handleMouseDown);
    this.addEventListener("keydown", this.handleKeyDown);
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has("orientation")) {
      this.setAttribute("aria-orientation", this.orientation);
    }
    if (changedProperties.has("label")) {
      this.setAttribute("aria-label", this.label);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("mousedown", this.handleMouseDown);
    this.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    let delta = 0;
    const step = e.shiftKey ? 0.1 : 0.05;

    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      delta = -step;
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      delta = step;
    }

    if (delta !== 0) {
      e.preventDefault();
      let newRatio = this.splitRatio + delta;
      newRatio = Math.max(this.minRatio, Math.min(this.maxRatio, newRatio));

      this.dispatchEvent(
        new CustomEvent("resize", {
          detail: { splitRatio: newRatio },
          bubbles: true,
          composed: true,
        }),
      );
    }
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.startX = e.clientX;
    this.startRatio = this.splitRatio;
    this.classList.add("dragging");

    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);

    e.preventDefault();
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) {
      return;
    }

    const container = this.parentElement;
    if (!container) {
      return;
    }

    const containerWidth = container.getBoundingClientRect().width;
    const deltaX = e.clientX - this.startX;
    const deltaRatio = deltaX / containerWidth;

    let newRatio = this.startRatio + deltaRatio;
    newRatio = Math.max(this.minRatio, Math.min(this.maxRatio, newRatio));

    this.dispatchEvent(
      new CustomEvent("resize", {
        detail: { splitRatio: newRatio },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handleMouseUp = () => {
    this.isDragging = false;
    this.classList.remove("dragging");

    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "resizable-divider": ResizableDivider;
  }
}
