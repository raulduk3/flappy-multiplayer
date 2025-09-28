import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";

// T048: Snapshot cadence ~45 Hz over a short window with tolerance
// We allow a tolerance band since timers and scheduling can vary under CI.
describe("integration: snapshot cadence ~45 Hz", () => {
  it("emits snapshots roughly every ~22ms (45 Hz) within tolerance", async () => {
    const srv = await startServer({ port: 0 });
    const url = `ws://localhost:${srv.port}`;

    try {
      const timestamps: number[] = [];

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(url);
        const timer = setTimeout(
          () => reject(new Error("timeout waiting for snapshot cadence")),
          6000,
        );

        ws.on("open", () => {
          ws.send(
            JSON.stringify({
              protocol_version: "1",
              type: "join.request",
              payload: {},
            }),
          );
          // Start a run so snapshots include at least one player
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
          const now = Date.now();
          const msg = JSON.parse(data.toString());
          if (msg?.type === "snapshot.event") {
            timestamps.push(now);
            if (timestamps.length >= 30) {
              // collect ~30 samples (~0.66s)
              clearTimeout(timer);
              ws.close();
              resolve();
            }
          }
        });

        ws.on("error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });

      // Compute inter-arrival deltas
      const deltas: number[] = [];
      for (let i = 1; i < timestamps.length; i++) {
        deltas.push(timestamps[i] - timestamps[i - 1]);
      }

      // Basic sanity: we should have enough deltas
      expect(deltas.length).toBeGreaterThanOrEqual(20);

      // Calculate average interval and ensure it's near 22ms within a reasonable tolerance
      const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;

      // Target period for 45 Hz is ~22.22ms. Allow a wide tolerance in CI: 16ms..35ms
      // 16ms corresponds to 60 Hz (upper bound), 35ms ~28.5 Hz (lower bound).
      expect(avg).toBeGreaterThanOrEqual(16);
      expect(avg).toBeLessThanOrEqual(35);

      // Optional: ensure most deltas are not wildly off (robustness)
      const withinBand = deltas.filter((d) => d >= 12 && d <= 45).length;
      expect(withinBand / deltas.length).toBeGreaterThan(0.8);
    } finally {
      await srv.close();
    }
  }, 10000);
});
