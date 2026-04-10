import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, test } from "vitest";
import type { CanvasHostHandler } from "../canvas-host/server.js";
import { withGatewayServer, sendRequest } from "./server-http.test-harness.js";

describe("Gateway HTTP Routing", () => {
  test("plugin endpoints are routed before canvasHost middleware to avoid 405 Method Not Allowed", async () => {
    const canvasHost: CanvasHostHandler = {
      rootDir: "test",
      basePath: "/canvas",
      handleHttpRequest: async (req, res) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("Method Not Allowed");
          return true;
        }
        return false;
      },
      handleUpgrade: () => false,
      close: async () => {},
    };

    const handlePluginRequest = async (req: IncomingMessage, res: ServerResponse) => {
      if (req.method === "POST" && req.url === "/canvas/plugin-endpoint") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ plugin: "success" }));
        return true;
      }
      return false;
    };

    await withGatewayServer({
      resolvedAuth: { mode: "none", allowTailscale: false },
      overrides: {
        canvasHost,
        handlePluginRequest,
        shouldEnforcePluginGatewayAuth: () => false,
      } as unknown as Record<string, unknown>,
      run: async (server) => {
        const res = await sendRequest(server, {
          path: "/canvas/plugin-endpoint",
          method: "POST",
        });
        expect(res.res.statusCode).toBe(200);
        expect(res.end).toHaveBeenCalledWith(JSON.stringify({ plugin: "success" }));
      },
    });
  });
});
