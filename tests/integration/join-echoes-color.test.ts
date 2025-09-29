import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";

describe("integration: join echoes color", () => {
  it("join.ack includes the same color provided in join.request", async () => {
    const srv = await startServer({ port: 0 });
    const url = `ws://localhost:${srv.port}`;

    try {
      const color = "#33CC99";
      const ack: any = await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("timeout waiting for join.ack")),
          3000,
        );
        const ws = new WebSocket(url);
        ws.on("open", () => {
          const envelope = {
            protocol_version: "1",
            type: "join.request",
            payload: { client_info: { agent: "test" }, color },
          };
          ws.send(JSON.stringify(envelope));
        });
        ws.on("message", (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === "join.ack") {
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

      expect(ack).toBeDefined();
      expect(ack.type).toBe("join.ack");
      expect(ack.payload.color).toBe(color);
    } finally {
      await srv.close();
    }
  });
});
