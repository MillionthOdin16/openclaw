import type { AddressInfo } from "node:net";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sendJson, sendText } from "./http-common.js";

let sharedPort = 0;
let sharedServer: ReturnType<typeof createServer> | undefined;

beforeAll(async () => {
  sharedServer = createServer((req, res) => {
    if (req.url === "/json") {
      sendJson(res, 200, { ok: true });
    } else if (req.url === "/text") {
      sendText(res, 200, "ok");
    } else {
      res.statusCode = 404;
      res.end();
    }
  });

  await new Promise<void>((resolve, reject) => {
    sharedServer?.once("error", reject);
    sharedServer?.listen(0, "127.0.0.1", () => {
      const address = sharedServer?.address() as AddressInfo | null;
      sharedPort = address?.port ?? 0;
      resolve();
    });
  });
});

afterAll(async () => {
  const server = sharedServer;
  if (!server) {
    return;
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  sharedServer = undefined;
});

describe("HTTP Security Headers", () => {
  it("should have security headers on JSON response", async () => {
    const res = await fetch(`http://127.0.0.1:${sharedPort}/json`);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("should have security headers on Text response", async () => {
    const res = await fetch(`http://127.0.0.1:${sharedPort}/text`);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
  });
});
