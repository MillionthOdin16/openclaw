export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    let result = "[" + stableStringify(value[0]);
    for (let i = 1; i < value.length; i++) {
      result += "," + stableStringify(value[i]);
    }
    result += "]";
    return result;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).toSorted();
  if (keys.length === 0) {
    return "{}";
  }
  let result = "{";
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (i > 0) {
      result += ",";
    }
    result += JSON.stringify(key) + ":" + stableStringify(record[key]);
  }
  result += "}";
  return result;
}
