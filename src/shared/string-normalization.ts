export function normalizeStringEntries(list?: ReadonlyArray<unknown>) {
  const result: string[] = [];
  // ⚡ Bolt: Single-pass for...of loop avoids intermediate array allocations from .map().filter()
  for (const entry of list ?? []) {
    const trimmed = String(entry).trim();
    if (trimmed) {
      result.push(trimmed);
    }
  }
  return result;
}

export function normalizeStringEntriesLower(list?: ReadonlyArray<unknown>) {
  const result: string[] = [];
  // ⚡ Bolt: Single-pass for...of loop avoids intermediate array allocations
  for (const entry of list ?? []) {
    const trimmed = String(entry).trim();
    if (trimmed) {
      result.push(trimmed.toLowerCase());
    }
  }
  return result;
}

export function normalizeHyphenSlug(raw?: string | null) {
  const trimmed = raw?.trim().toLowerCase() ?? "";
  if (!trimmed) {
    return "";
  }
  const dashed = trimmed.replace(/\s+/g, "-");
  const cleaned = dashed.replace(/[^a-z0-9#@._+-]+/g, "-");
  return cleaned.replace(/-{2,}/g, "-").replace(/^[-.]+|[-.]+$/g, "");
}

export function normalizeAtHashSlug(raw?: string | null) {
  const trimmed = raw?.trim().toLowerCase() ?? "";
  if (!trimmed) {
    return "";
  }
  const withoutPrefix = trimmed.replace(/^[@#]+/, "");
  const dashed = withoutPrefix.replace(/[\s_]+/g, "-");
  const cleaned = dashed.replace(/[^a-z0-9-]+/g, "-");
  return cleaned.replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
}
