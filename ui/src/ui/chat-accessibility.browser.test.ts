import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { OpenClawApp } from "./app.ts";

// oxlint-disable-next-line typescript/unbound-method
const originalConnect = OpenClawApp.prototype.connect;

function mountApp(pathname: string) {
  window.history.replaceState({}, "", pathname);
  const app = document.createElement("openclaw-app") as OpenClawApp;
  document.body.append(app);
  return app;
}

beforeEach(() => {
  OpenClawApp.prototype.connect = () => {
    // no-op: avoid real gateway WS connections in browser tests
  };
  window.__OPENCLAW_CONTROL_UI_BASE_PATH__ = undefined;
  localStorage.clear();
  document.body.innerHTML = "";
});

afterEach(() => {
  OpenClawApp.prototype.connect = originalConnect;
  window.__OPENCLAW_CONTROL_UI_BASE_PATH__ = undefined;
  localStorage.clear();
  document.body.innerHTML = "";
});

describe("chat accessibility", () => {
  it("renders correct aria-labels for chat buttons", async () => {
    const app = mountApp("/chat");
    app.connected = true; // Simulate connected state
    await app.updateComplete;

    // Check Send button (default state)
    const sendButton = app.querySelector(".chat-compose__actions .btn.primary");
    expect(sendButton).not.toBeNull();
    expect(sendButton?.getAttribute("aria-label")).toBe("Send message");
    expect(sendButton?.getAttribute("title")).toBe("Send message (Enter)");

    // Check New Session button (default state)
    const newSessionButton = app.querySelector(".chat-compose__actions .btn:not(.primary)");
    expect(newSessionButton).not.toBeNull();
    expect(newSessionButton?.getAttribute("aria-label")).toBe("Start a new chat session");
    expect(newSessionButton?.getAttribute("title")).toBe("Clear chat context and start new session");

    // Simulate sending state
    app.chatSending = true;
    app.chatRunId = "run-123"; // Make it abortable
    await app.updateComplete;

    // Check Send button (queue state)
    const queueButton = app.querySelector(".chat-compose__actions .btn.primary");
    expect(queueButton?.getAttribute("aria-label")).toBe("Queue message");
    expect(queueButton?.getAttribute("title")).toBe("Add message to queue");

    // Check Stop button (abortable state)
    const stopButton = app.querySelector(".chat-compose__actions .btn:not(.primary)");
    expect(stopButton?.getAttribute("aria-label")).toBe("Stop generating response");
    expect(stopButton?.getAttribute("title")).toBe("Stop generating");
  });

  it("renders aria-label for new messages button", async () => {
    const app = mountApp("/chat");
    app.connected = true;
    // Force new messages button to appear
    app.chatNewMessagesBelow = true;
    await app.updateComplete;

    const newMessagesButton = app.querySelector(".chat-new-messages");
    expect(newMessagesButton).not.toBeNull();
    expect(newMessagesButton?.getAttribute("aria-label")).toBe("Scroll to new messages");
  });

  it("renders aria-label for sidebar close button", async () => {
    const app = mountApp("/chat");
    app.connected = true;
    // Open sidebar
    app.handleOpenSidebar("some content");
    await app.updateComplete;

    const closeButton = app.querySelector(".sidebar-header .btn");
    expect(closeButton).not.toBeNull();
    expect(closeButton?.getAttribute("aria-label")).toBe("Close sidebar");
  });
});
