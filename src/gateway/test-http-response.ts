import type { ServerResponse } from "node:http";
import { vi } from "vitest";

export function makeMockHttpResponse(): {
  res: ServerResponse & { headers: Record<string, string | string[]> };
  setHeader: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
} {
  const headers: Record<string, string | string[]> = {};
  const setHeader = vi.fn((key: string, value: string | string[]) => {
    headers[key] = value;
    return undefined as unknown as ServerResponse;
  });
  const end = vi.fn();
  const res = {
    headersSent: false,
    statusCode: 200,
    headers,
    setHeader,
    end,
  } as unknown as ServerResponse & { headers: Record<string, string | string[]> };
  return { res, setHeader, end };
}
