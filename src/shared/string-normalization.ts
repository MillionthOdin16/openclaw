export function normalizeStringEntries(list?: ReadonlyArray<unknown>) {
  if (!list) {
    return [];
  }
  // Optimization: use a for loop instead of map().filter()
  // to avoid allocating an intermediate array and reduce CPU overhead.
  const result: string[] = [];
  for (let i = 0, len = list.length; i < len; i++) {
    const trimmed = String(list[i]).trim();
    if (trimmed) {
      result.push(trimmed);
    }
  }
  return result;
}

export function normalizeStringEntriesLower(list?: ReadonlyArray<unknown>) {
  if (!list) {
    return [];
  }
  // Optimization: avoid map().filter() chain and inline lowercasing
  // to prevent intermediate array allocations.
  const result: string[] = [];
  for (let i = 0, len = list.length; i < len; i++) {
    const trimmed = String(list[i]).trim().toLowerCase();
    if (trimmed) {
      result.push(trimmed);
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
