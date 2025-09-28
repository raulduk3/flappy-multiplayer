import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";

describe("integration: collision ends run and prunes from snapshots", () => {
  it("emits runEnd.event when colliding with top bound and later snapshots exclude player", async () => {
    const srv = await startServer({ port: 0 });
    const url = `ws://localhost:${srv.port}`;

    try {
      const messages: any[] = [];
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("timeout waiting for runEnd")),
          5000,
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
          // Force a collision by sending many flaps up quickly negative vy then gravity will bring up past top
          let count = 0;
          const burst = setInterval(() => {
            if (count++ > 10) {
              clearInterval(burst);
              return;
            }
            ws.send(
              JSON.stringify({
                protocol_version: "1",
                type: "input.flap.request",
                payload: {},
              }),
            );
          }, 10);
        });
        ws.on("message", (data) => {
          const msg = JSON.parse(data.toString());
          messages.push(msg);
          if (msg?.type === "runEnd.event") {
            clearTimeout(timer);
            // Wait a bit for more snapshots after end
            setTimeout(() => {
              ws.close();
              resolve();
            }, 200);
          }
        });
        ws.on("error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });

      const end = messages.find((m) => m.type === "runEnd.event");
      expect(end).toBeDefined();
      expect(end.payload.reason).toBe("collision");

      // After runEnd, snapshots should not include player
      const afterEndSnaps = messages
        .filter((m) => m.type === "snapshot.event")
        .slice(-3);
      for (const s of afterEndSnaps) {
        expect(Array.isArray(s.payload.players)).toBe(true);
        if (s.payload.players.length > 0) {
          // No players should be present once pruned; this is a simplistic single-session test
          expect(
            s.payload.players.find((p: any) => p.run_id === end.payload.run_id),
          ).toBeUndefined();
        }
      }
    } finally {
      await srv.close();
    }
  }, 8000);
});
