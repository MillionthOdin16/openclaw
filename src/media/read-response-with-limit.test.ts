import { describe, expect, it } from "vitest";
import { readResponseWithLimit } from "./read-response-with-limit.js";

function makeStream(chunks: Uint8Array[], delayMs?: number) {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        if (delayMs) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

function makeStallingStream(initialChunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of initialChunks) {
        controller.enqueue(chunk);
      }
    },
  });
}

describe("readResponseWithLimit", () => {
  it("reads all chunks within the limit", async () => {
    const body = makeStream([new Uint8Array([1, 2]), new Uint8Array([3, 4])]);
    const res = new Response(body);
    const buf = await readResponseWithLimit(res, 100);
    expect(buf).toEqual(Buffer.from([1, 2, 3, 4]));
  });

  it("throws when total exceeds maxBytes", async () => {
    const body = makeStream([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])]);
    const res = new Response(body);
    await expect(readResponseWithLimit(res, 4)).rejects.toThrow(/too large/i);
  });

  it("calls custom onOverflow", async () => {
    const body = makeStream([new Uint8Array(10)]);
    const res = new Response(body);
    await expect(
      readResponseWithLimit(res, 5, {
        onOverflow: ({ size, maxBytes }) => new Error(`custom: ${size} > ${maxBytes}`),
      }),
    ).rejects.toThrow("custom: 10 > 5");
  });

  it("times out when no new chunk arrives before idle timeout", async () => {
    const body = makeStallingStream([new Uint8Array([1, 2])]);
    const res = new Response(body);
    await expect(readResponseWithLimit(res, 1024, { chunkTimeoutMs: 50 })).rejects.toThrow(
      /stalled/i,
    );
  }, 5_000);

  it("does not time out while chunks keep arriving", async () => {
    const body = makeStream([new Uint8Array([1]), new Uint8Array([2])], 10);
    const res = new Response(body);
    const buf = await readResponseWithLimit(res, 100, { chunkTimeoutMs: 500 });
    expect(buf).toEqual(Buffer.from([1, 2]));
  });

  it("uses arrayBuffer fallback if body has no getReader", async () => {
    const mockRes = {
      body: {},
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    } as unknown as Response;
    const buf = await readResponseWithLimit(mockRes, 10);
    expect(buf).toEqual(Buffer.from([1, 2, 3]));
  });

  it("uses arrayBuffer fallback and throws if exceeding limit", async () => {
    const mockRes = {
      body: {},
      arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
    } as unknown as Response;
    await expect(readResponseWithLimit(mockRes, 3)).rejects.toThrow(/too large/i);
  });

  it("rejects if reader.read() fails before timeout", async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.error(new Error("reader error"));
      },
    });
    const res = new Response(body);
    await expect(readResponseWithLimit(res, 100, { chunkTimeoutMs: 50 })).rejects.toThrow("reader error");
  });

  it("ignores errors thrown by reader.cancel when exceeding limit", async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3, 4]));
      },
      cancel() {
        throw new Error("cancel error");
      },
    });
    const res = new Response(body);
    await expect(readResponseWithLimit(res, 3)).rejects.toThrow(/too large/i);
  });

  it("ignores errors thrown by reader.releaseLock in finally block", async () => {
    let released = false;
    const mockRes = {
      body: {
        getReader: () => ({
          read: async () => ({ done: true, value: undefined }),
          releaseLock: () => {
            released = true;
            throw new Error("release error");
          },
        }),
      },
    } as unknown as Response;

    const buf = await readResponseWithLimit(mockRes, 100);
    expect(buf).toEqual(Buffer.from([]));
    expect(released).toBe(true);
  });
});
