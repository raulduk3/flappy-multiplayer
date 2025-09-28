import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";

describe("integration: runStart after first flap", () => {
  it("emits runStart.event with run_id after first input.flap.request", async () => {
    const srv = await startServer({ port: 0 });
    const url = `ws://localhost:${srv.port}`;

    try {
      const result: any = await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("timeout waiting for runStart.event")),
          4000,
        );
        const ws = new WebSocket(url);
        ws.on("open", () => {
          // Join first
          ws.send(
            JSON.stringify({
              protocol_version: "1",
              type: "join.request",
              payload: { client_info: { agent: "test" } },
            }),
          );
          // Slight delay to allow join.ack then send first flap
          setTimeout(() => {
            ws.send(
              JSON.stringify({
                protocol_version: "1",
                type: "input.flap.request",
                payload: {},
              }),
            );
          }, 50);
        });
        ws.on("message", (data) => {
          const msg = JSON.parse(data.toString());
          if (msg?.type === "runStart.event") {
            clearTimeout(timer);
            ws.close();
            resolve(msg);
          }
        });
        ws.on("error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });

      expect(result).toBeDefined();
      expect(result.protocol_version).toBe("1");
      expect(result.type).toBe("runStart.event");
      expect(typeof result.payload?.room_id).toBe("string");
      expect(typeof result.payload?.run_id).toBe("string");
      expect(typeof result.payload?.tick).toBe("number");
    } finally {
      await srv.close();
    }
  });
});
