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
  @property({ type: String }) label = "Resize split view";
  @property({ type: String }) orientation: "vertical" | "horizontal" = "vertical";

  private isDragging = false;
  private startPos = 0;
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
      width: 100%;
      height: 4px;
      cursor: row-resize;
    }
    :host::before {
      content: "";
      position: absolute;
      top: 0;
      left: -4px;
      right: -4px;
      bottom: 0;
    }
    :host([orientation="horizontal"])::before {
      top: -4px;
      left: 0;
      right: 0;
      bottom: -4px;
    }
    :host(:hover),
    :host(:focus-visible) {
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

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    this.setAttribute("role", "separator");
    this.setAttribute("tabindex", "0");
    this.setAttribute("aria-orientation", this.orientation);
    this.setAttribute("aria-label", this.label);

    // Scale splitRatio (usually 0-1) to percentage for aria values
    this.setAttribute("aria-valuenow", String(Math.round(this.splitRatio * 100)));
    this.setAttribute("aria-valuemin", String(Math.round(this.minRatio * 100)));
    this.setAttribute("aria-valuemax", String(Math.round(this.maxRatio * 100)));
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    let delta = 0;
    const step = 0.05; // 5% adjustments per keypress

    if (this.orientation === "vertical") {
      if (e.key === "ArrowLeft") {
        delta = -step;
      } else if (e.key === "ArrowRight") {
        delta = step;
      }
    } else {
      if (e.key === "ArrowUp") {
        delta = -step;
      } else if (e.key === "ArrowDown") {
        delta = step;
      }
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
    this.startPos = this.orientation === "vertical" ? e.clientX : e.clientY;
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

    const containerSize =
      this.orientation === "vertical"
        ? container.getBoundingClientRect().width
        : container.getBoundingClientRect().height;

    const delta = (this.orientation === "vertical" ? e.clientX : e.clientY) - this.startPos;
    const deltaRatio = delta / containerSize;

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
