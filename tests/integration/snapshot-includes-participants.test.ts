import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";

describe("integration: snapshot includes participants", () => {
  it("spectating client sees participants with idle status before first flap, then active after", async () => {
    const srv = await startServer({ port: 0 });
    const url = `ws://localhost:${srv.port}`;

    try {
      const messages: any[] = [];
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("timeout")), 6000);
        const ws = new WebSocket(url);
        ws.on("open", () => {
          ws.send(
            JSON.stringify({
              protocol_version: "1",
              type: "join.request",
              payload: { color: "#112233" },
            }),
          );
          // Watch snapshots for a bit, then flap
          setTimeout(() => {
            ws.send(
              JSON.stringify({
                protocol_version: "1",
                type: "input.flap.request",
                payload: {},
              }),
            );
          }, 200);
          setTimeout(() => {
            ws.close();
            clearTimeout(timer);
            resolve();
          }, 1200);
        });
        ws.on("message", (d) => messages.push(JSON.parse(d.toString())));
        ws.on("error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });

      const snaps = messages.filter((m) => m.type === "snapshot.event");
      expect(snaps.length).toBeGreaterThan(0);

      // Before flap: expect at least one snapshot with our participant idle
      const pre = snaps.find((s: any) => Array.isArray(s.payload.participants));
      expect(pre).toBeTruthy();
      const idleEntry = pre.payload.participants.find((p: any) => p.player_id && p.status === "idle" && p.color);
      expect(idleEntry).toBeTruthy();

      // After flap: expect a snapshot where our participant becomes active (position/velocity present)
      const post = snaps.reverse().find((s: any) => Array.isArray(s.payload.participants));
      expect(post).toBeTruthy();
      const activeEntry = post.payload.participants.find((p: any) => p.status === "active" && p.position && p.velocity);
      expect(activeEntry).toBeTruthy();
    } finally {
      await srv.close();
    }
  });
});
