import { describe, expect, it } from "vitest";
import { normalizeBatchBaseUrl, buildBatchHeaders, splitBatchRequests } from "./batch-utils.js";

describe("batch-utils", () => {
  describe("normalizeBatchBaseUrl", () => {
    it("returns empty string if baseUrl is undefined", () => {
      expect(normalizeBatchBaseUrl({})).toBe("");
    });
    it("removes trailing slash", () => {
      expect(normalizeBatchBaseUrl({ baseUrl: "https://example.com/" })).toBe("https://example.com");
    });
    it("leaves url unchanged if no trailing slash", () => {
      expect(normalizeBatchBaseUrl({ baseUrl: "https://example.com" })).toBe("https://example.com");
    });
  });

  describe("buildBatchHeaders", () => {
    it("adds Content-Type application/json if json is true and not provided", () => {
      const headers = buildBatchHeaders({}, { json: true });
      expect(headers).toEqual({ "Content-Type": "application/json" });
    });
    it("preserves existing Content-Type", () => {
      const headers = buildBatchHeaders({ headers: { "Content-Type": "text/plain" } }, { json: true });
      expect(headers).toEqual({ "Content-Type": "text/plain" });
    });
    it("preserves lowercase content-type", () => {
      const headers = buildBatchHeaders({ headers: { "content-type": "text/plain" } }, { json: true });
      expect(headers).toEqual({ "content-type": "text/plain" });
    });
    it("removes Content-Type if json is false", () => {
      const headers = buildBatchHeaders({ headers: { "Content-Type": "application/json", "content-type": "application/json" } }, { json: false });
      expect(headers).toEqual({});
    });
  });

  describe("splitBatchRequests", () => {
    it("returns single group if requests length <= maxRequests", () => {
      expect(splitBatchRequests([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
      expect(splitBatchRequests([1, 2], 3)).toEqual([[1, 2]]);
      expect(splitBatchRequests([], 3)).toEqual([[]]);
    });
    it("splits requests into multiple groups", () => {
      expect(splitBatchRequests([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
  });
});
