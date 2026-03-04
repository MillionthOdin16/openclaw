import { LitElement, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * A draggable divider for resizable split views.
 * Dispatches 'resize' events with { splitRatio: number } detail.
 */
@customElement("resizable-divider")
export class ResizableDivider extends LitElement {
  @property({ type: String }) label = "Resize panel";
  @property({ type: String }) orientation: "vertical" | "horizontal" = "vertical";
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
    :host(:focus-visible) {
      outline: 2px solid var(--accent, #007bff);
      outline-offset: 2px;
      z-index: 10;
    }
  `;

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has("orientation")) {
      this.setAttribute("aria-orientation", this.orientation);
    }
    if (changedProperties.has("label")) {
      this.setAttribute("aria-label", this.label);
    }
    if (
      changedProperties.has("splitRatio") ||
      changedProperties.has("minRatio") ||
      changedProperties.has("maxRatio")
    ) {
      this.setAttribute("aria-valuenow", String(Math.round(this.splitRatio * 100)));
      this.setAttribute("aria-valuemin", String(Math.round(this.minRatio * 100)));
      this.setAttribute("aria-valuemax", String(Math.round(this.maxRatio * 100)));
    }
  }

  render() {
    return nothing;
  }

  connectedCallback() {
    super.connectedCallback();
    this.tabIndex = 0;
    this.role = "separator";
    this.addEventListener("mousedown", this.handleMouseDown);
    this.addEventListener("keydown", this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("mousedown", this.handleMouseDown);
    this.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    let deltaRatio = 0;
    const step = 0.05;

    if (this.orientation === "vertical") {
      if (e.key === "ArrowLeft") {
        deltaRatio = -step;
      } else if (e.key === "ArrowRight") {
        deltaRatio = step;
      }
    } else {
      if (e.key === "ArrowUp") {
        deltaRatio = -step;
      } else if (e.key === "ArrowDown") {
        deltaRatio = step;
      }
    }

    if (deltaRatio !== 0) {
      e.preventDefault();
      let newRatio = this.splitRatio + deltaRatio;
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
