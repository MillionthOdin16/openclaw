import { describe, expect, it, vi, afterEach } from "vitest";
import * as ssrf from "../infra/net/ssrf.js";
import { mockPinnedHostnameResolution } from "./ssrf.js";

describe("mockPinnedHostnameResolution", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mocks resolvePinnedHostname with default addresses", async () => {
    const spy = mockPinnedHostnameResolution();

    const result = await ssrf.resolvePinnedHostname("example.com");

    expect(result.hostname).toBe("example.com");
    expect(result.addresses).toEqual(["93.184.216.34"]);
    expect(typeof result.lookup).toBe("function");

    expect(spy).toHaveBeenCalledWith("example.com");
  });

  it("mocks resolvePinnedHostname with custom addresses", async () => {
    mockPinnedHostnameResolution(["1.2.3.4", "5.6.7.8"]);

    const result = await ssrf.resolvePinnedHostname("TEST.com.");

    expect(result.hostname).toBe("test.com"); // normalized
    expect(result.addresses).toEqual(["1.2.3.4", "5.6.7.8"]);
  });
});
