import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";

describe("integration: restart after runEnd yields new run_id", () => {
  it("after runEnd, next flap starts a new run with a different run_id", async () => {
    const srv = await startServer({ port: 0 });
    const url = `ws://localhost:${srv.port}`;

    try {
      const events: any[] = [];
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("timeout waiting for second runStart")),
          8000,
        );
        const ws = new WebSocket(url);
        ws.on("open", () => {
          ws.send(
            JSON.stringify({
              protocol_version: "1",
              type: "join.request",
              payload: {},
            }),
          );
          setTimeout(() => {
            ws.send(
              JSON.stringify({
                protocol_version: "1",
                type: "input.flap.request",
                payload: {},
              }),
            );
          }, 50);
          // induce collision after some time with repeated flaps up
          let c = 0;
          const burst = setInterval(() => {
            if (c++ > 10) clearInterval(burst);
            ws.send(
              JSON.stringify({
                protocol_version: "1",
                type: "input.flap.request",
                payload: {},
              }),
            );
          }, 15);
        });
        ws.on("message", (data) => {
          const msg = JSON.parse(data.toString());
          events.push(msg);
          const last = events[events.length - 1];
          if (last?.type === "runEnd.event") {
            // start again after short delay
            setTimeout(() => {
              // second run start
              ws.send(
                JSON.stringify({
                  protocol_version: "1",
                  type: "input.flap.request",
                  payload: {},
                }),
              );
            }, 50);
          }
          if (events.filter((e) => e.type === "runStart.event").length >= 2) {
            clearTimeout(timer);
            ws.close();
            resolve();
          }
        });
        ws.on("error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });

      const runStarts = events.filter((e) => e.type === "runStart.event");
      expect(runStarts.length).toBeGreaterThanOrEqual(2);
      const [first, second] = runStarts;
      expect(first.payload.run_id).not.toBe(second.payload.run_id);
    } finally {
      await srv.close();
    }
  }, 10000);
});
