import { describe, expect, it, vi, beforeEach } from "vitest";
import { uploadBatchJsonlFile } from "./batch-upload.js";
import * as remoteHttp from "./remote-http.js";

vi.mock("./remote-http.js");

describe("batch-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads jsonl file and returns id", async () => {
    vi.mocked(remoteHttp.withRemoteHttpResponse).mockImplementation(async (args: any) => {
      expect(args.url).toBe("https://api.example.com/files");
      expect(args.init.method).toBe("POST");
      return args.onResponse({
        ok: true,
        json: async () => ({ id: "file-123" }),
      });
    });

    const id = await uploadBatchJsonlFile({
      client: { baseUrl: "https://api.example.com" },
      requests: [{ foo: "bar" }, { foo: "baz" }],
      errorPrefix: "Upload Error",
    });

    expect(id).toBe("file-123");
  });

  it("throws error if response is not ok", async () => {
    vi.mocked(remoteHttp.withRemoteHttpResponse).mockImplementation(async (args: any) => {
      return args.onResponse({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });
    });

    await expect(uploadBatchJsonlFile({
      client: { baseUrl: "https://api.example.com" },
      requests: [{ foo: "bar" }],
      errorPrefix: "Upload Error",
    })).rejects.toThrow("Upload Error: 400 Bad Request");
  });

  it("throws error if missing id in response", async () => {
    vi.mocked(remoteHttp.withRemoteHttpResponse).mockImplementation(async (args: any) => {
      return args.onResponse({
        ok: true,
        json: async () => ({}),
      });
    });

    await expect(uploadBatchJsonlFile({
      client: { baseUrl: "https://api.example.com" },
      requests: [{ foo: "bar" }],
      errorPrefix: "Upload Error",
    })).rejects.toThrow("Upload Error: missing file id");
  });
});
