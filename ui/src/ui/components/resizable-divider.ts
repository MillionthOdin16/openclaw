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
      transition: background 150ms ease-out, box-shadow 150ms ease-out;
      flex-shrink: 0;
      position: relative;
      outline: none;
    }
    :host(:focus-visible) {
      box-shadow: 0 0 0 2px var(--accent, #007bff);
      z-index: 1;
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
    this.tabIndex = 0;
    this.setAttribute("role", "separator");
    this.setAttribute("aria-orientation", "vertical");
    this.updateAriaAttributes();

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

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties);
    if (
      changedProperties.has("splitRatio") ||
      changedProperties.has("minRatio") ||
      changedProperties.has("maxRatio")
    ) {
      this.updateAriaAttributes();
    }
  }

  private updateAriaAttributes() {
    this.setAttribute("aria-valuenow", String(Math.round(this.splitRatio * 100)));
    this.setAttribute("aria-valuemin", String(Math.round(this.minRatio * 100)));
    this.setAttribute("aria-valuemax", String(Math.round(this.maxRatio * 100)));
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    let newRatio = this.splitRatio;
    const step = 0.05; // 5% step

    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        newRatio = Math.max(this.minRatio, this.splitRatio - step);
        break;
      case "ArrowRight":
      case "ArrowDown":
        newRatio = Math.min(this.maxRatio, this.splitRatio + step);
        break;
      case "Home":
        newRatio = this.minRatio;
        break;
      case "End":
        newRatio = this.maxRatio;
        break;
      default:
        return; // Do nothing for other keys
    }

    e.preventDefault();

    if (newRatio !== this.splitRatio) {
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
