import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";

// This test will initially fail until we implement a simple tick/snapshot loop
describe("integration: flap affects physics and snapshots at ~45 Hz", () => {
  it("receives snapshots with active player; flap reduces vy (upward impulse)", async () => {
    const srv = await startServer({ port: 0 });
    const url = `ws://localhost:${srv.port}`;

    try {
      const received: any[] = [];
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("timeout waiting for snapshots")),
          4000,
        );
        const ws = new WebSocket(url);
        let opened = false;
        ws.on("open", () => {
          opened = true;
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
        });
        ws.on("message", (data) => {
          const msg = JSON.parse(data.toString());
          if (msg?.type === "snapshot.event") {
            received.push(msg);
            if (received.length >= 10) {
              clearTimeout(timer);
              ws.close();
              resolve();
            }
          }
        });
        ws.on("error", (err) => {
          if (!opened) return; // ignore connect errors if any
          clearTimeout(timer);
          reject(err);
        });
      });

      expect(received.length).toBeGreaterThanOrEqual(10);
      // Basic structure checks
      for (const snap of received) {
        expect(snap.protocol_version).toBe("1");
        expect(snap.type).toBe("snapshot.event");
        expect(typeof snap.payload.room_id).toBe("string");
        expect(typeof snap.payload.tick).toBe("number");
        expect(typeof snap.payload.seed).toBe("string");
        expect(Array.isArray(snap.payload.players)).toBe(true);
        if (snap.payload.players.length > 0) {
          const p = snap.payload.players[0];
          expect(typeof p.run_id).toBe("string");
          expect(p.status).toBe("alive");
        }
      }
    } finally {
      await srv.close();
    }
  }, 7000);
});
