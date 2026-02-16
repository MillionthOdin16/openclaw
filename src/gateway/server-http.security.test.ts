import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { getFreePort, startGatewayServer } from "./test-helpers.js";

describe("gateway http security headers", () => {
  let server: Awaited<ReturnType<typeof startGatewayServer>>;
  let port: number;

  beforeAll(async () => {
    port = await getFreePort();
    server = await startGatewayServer(port);
  });

  afterAll(async () => {
    await server.close();
  });

  test("GET / should have security headers", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/`);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
  });

  test("GET /unknown should have security headers", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/unknown-path`);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
  });
});
