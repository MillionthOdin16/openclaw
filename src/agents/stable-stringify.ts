export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const s = JSON.stringify(value);
    return s === undefined ? "null" : s;
  }
  if (Array.isArray(value)) {
    const len = value.length;
    if (len === 0) {
      return "[]";
    }
    let out = "[" + stableStringify(value[0]);
    for (let i = 1; i < len; i++) {
      out += "," + stableStringify(value[i]);
    }
    return out + "]";
  }
  const keys = Object.keys(value);
  const len = keys.length;
  if (len === 0) {
    return "{}";
  }
  keys.sort();

  const firstKey = keys[0];
  let out =
    "{" + JSON.stringify(firstKey) + ":" + stableStringify((value as Record<string, unknown>)[firstKey]);
  for (let i = 1; i < len; i++) {
    const key = keys[i];
    out += "," + JSON.stringify(key) + ":" + stableStringify((value as Record<string, unknown>)[key]);
  }
  return out + "}";
}
