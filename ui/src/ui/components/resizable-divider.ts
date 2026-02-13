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

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has("splitRatio")) {
      this.setAttribute("aria-valuenow", String(this.splitRatio));
    }
    if (changedProperties.has("minRatio")) {
      this.setAttribute("aria-valuemin", String(this.minRatio));
    }
    if (changedProperties.has("maxRatio")) {
      this.setAttribute("aria-valuemax", String(this.maxRatio));
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("mousedown", this.handleMouseDown);
    this.addEventListener("keydown", this.handleKeyDown);

    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "separator");
    }
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
    }
    if (!this.hasAttribute("aria-label")) {
      this.setAttribute("aria-label", "Resize sidebar");
    }
    this.setAttribute("aria-valuemin", String(this.minRatio));
    this.setAttribute("aria-valuemax", String(this.maxRatio));
    this.setAttribute("aria-valuenow", String(this.splitRatio));
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
    if (e.key === "ArrowLeft") {
      delta = -0.05;
    } else if (e.key === "ArrowRight") {
      delta = 0.05;
    } else {
      return;
    }

    e.preventDefault();
    // Calculate new ratio
    let newRatio = this.splitRatio + delta;
    newRatio = Math.max(this.minRatio, Math.min(this.maxRatio, newRatio));

    // Dispatch event
    this.dispatchEvent(
      new CustomEvent("resize", {
        detail: { splitRatio: newRatio },
        bubbles: true,
        composed: true,
      }),
    );
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
