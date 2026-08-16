import { stripInboundMetadata } from "../../../../src/auto-reply/reply/strip-inbound-meta.js";
import { stripEnvelope } from "../../../../src/shared/chat-envelope.js";
import { stripThinkingTags } from "../format.ts";

const textCache = new WeakMap<object, string | null>();
const thinkingCache = new WeakMap<object, string | null>();

function processMessageText(text: string, role: string): string {
  const shouldStripInboundMetadata = role.toLowerCase() === "user";
  if (role === "assistant") {
    return stripThinkingTags(text);
  }
  return shouldStripInboundMetadata
    ? stripInboundMetadata(stripEnvelope(text))
    : stripEnvelope(text);
}

export function extractText(message: unknown): string | null {
  const m = message as Record<string, unknown>;
  const role = typeof m.role === "string" ? m.role : "";
  const raw = extractRawText(message);
  if (!raw) {
    return null;
  }
  return processMessageText(raw, role);
}

export function extractTextCached(message: unknown): string | null {
  if (!message || typeof message !== "object") {
    return extractText(message);
  }
  const obj = message;
  if (textCache.has(obj)) {
    return textCache.get(obj) ?? null;
  }
  const value = extractText(message);
  textCache.set(obj, value);
  return value;
}

export function extractThinking(message: unknown): string | null {
  const m = message as Record<string, unknown>;
  const content = m.content;
  const parts: string[] = [];
  if (Array.isArray(content)) {
    for (const p of content) {
      const item = p as Record<string, unknown>;
      if (item.type === "thinking" && typeof item.thinking === "string") {
        const cleaned = item.thinking.trim();
        if (cleaned) {
          parts.push(cleaned);
        }
      }
    }
  }
  if (parts.length > 0) {
    return parts.join("\n");
  }

  // Back-compat: older logs may still have <think> tags inside text blocks.
  const rawText = extractRawText(message);
  if (!rawText) {
    return null;
  }
  const matches = [
    ...rawText.matchAll(/<\s*think(?:ing)?\s*>([\s\S]*?)<\s*\/\s*think(?:ing)?\s*>/gi),
  ];
  // ⚡ Bolt: Replace chained .map().filter() with a single-pass loop to avoid intermediate array allocations and callback overhead.
  const extracted: string[] = [];
  for (const m of matches) {
    const val = (m[1] ?? "").trim();
    if (val) {
      extracted.push(val);
    }
  }
  return extracted.length > 0 ? extracted.join("\n") : null;
}

export function extractThinkingCached(message: unknown): string | null {
  if (!message || typeof message !== "object") {
    return extractThinking(message);
  }
  const obj = message;
  if (thinkingCache.has(obj)) {
    return thinkingCache.get(obj) ?? null;
  }
  const value = extractThinking(message);
  thinkingCache.set(obj, value);
  return value;
}

export function extractRawText(message: unknown): string | null {
  const m = message as Record<string, unknown>;
  const content = m.content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    // ⚡ Bolt: Replace chained .map().filter() with a single-pass loop to avoid intermediate array allocations and callback overhead.
    const parts: string[] = [];
    for (const p of content) {
      const item = p as Record<string, unknown>;
      if (item.type === "text" && typeof item.text === "string") {
        parts.push(item.text);
      }
    }
    if (parts.length > 0) {
      return parts.join("\n");
    }
  }
  if (typeof m.text === "string") {
    return m.text;
  }
  return null;
}

export function formatReasoningMarkdown(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  // ⚡ Bolt: Replace chained .map().filter().map() with a single-pass loop to avoid intermediate array allocations and callback overhead.
  const lines: string[] = [];
  for (const line of trimmed.split(/\r?\n/)) {
    const l = line.trim();
    if (l) {
      lines.push(`_${l}_`);
    }
  }
  return lines.length ? ["_Reasoning:_", ...lines].join("\n") : "";
}
