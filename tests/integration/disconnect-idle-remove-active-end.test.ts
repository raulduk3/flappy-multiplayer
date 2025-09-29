import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";

// T051: Disconnect semantics — idle removal vs active end

describe("integration: disconnect semantics", () => {
  it("idle disconnect removes participant without leaderboard; active disconnect records score and emits leaderboard", async () => {
    const srv = await startServer({ port: 0 });
    const url = `ws://localhost:${srv.port}`;

    try {
      const spectatorMsgs: any[] = [];

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("timeout waiting for disconnect semantics")),
          10000,
        );

        const wsIdle = new WebSocket(url);
        const wsActive = new WebSocket(url);
        const wsSpectator = new WebSocket(url);

        let idleJoined = false;
        let activeJoined = false;
        let spectatorJoined = false;
        let activeStarted = false;
        let didIdleClose = false;
        let sawLeaderboardAfterActiveClose = false;

        function maybeProceed() {
          if (idleJoined && spectatorJoined && !didIdleClose) {
            didIdleClose = true;
            // Close idle connection first: should NOT cause leaderboard
            wsIdle.close();
            // give a small gap to ensure messages would have arrived
            setTimeout(() => {
              const preUpdates = spectatorMsgs.filter((m) => m.type === "leaderboardUpdate.event");
              // none expected yet
              if (preUpdates.length !== 0) {
                clearTimeout(timer);
                reject(new Error("unexpected leaderboard after idle disconnect"));
                return;
              }
            }, 100);
          }
          if (activeJoined && spectatorJoined && !activeStarted) {
            activeStarted = true;
            // Start the active player's run
            setTimeout(() => {
              wsActive.send(
                JSON.stringify({
                  protocol_version: "1",
                  type: "input.flap.request",
                  payload: {},
                }),
              );
              // Shortly after starting, close the active connection to force run end recording
              setTimeout(() => wsActive.close(), 200);
            }, 50);
          }
        }

        wsSpectator.on("open", () => {
          wsSpectator.send(
            JSON.stringify({
              protocol_version: "1",
              type: "join.request",
              payload: {},
            }),
          );
        });
        wsIdle.on("open", () => {
          wsIdle.send(
            JSON.stringify({
              protocol_version: "1",
              type: "join.request",
              payload: {},
            }),
          );
        });
        wsActive.on("open", () => {
          wsActive.send(
            JSON.stringify({
              protocol_version: "1",
              type: "join.request",
              payload: { color: "#2299DD" },
            }),
          );
        });

        wsSpectator.on("message", (d) => {
          const msg = JSON.parse(d.toString());
          spectatorMsgs.push(msg);
          if (msg.type === "join.ack") spectatorJoined = true;
          if (msg.type === "leaderboardUpdate.event") {
            sawLeaderboardAfterActiveClose = true;
            clearTimeout(timer);
            wsSpectator.close();
            resolve();
          }
          maybeProceed();
        });

        wsIdle.on("message", (d) => {
          const msg = JSON.parse(d.toString());
          if (msg.type === "join.ack") idleJoined = true;
          maybeProceed();
        });
        wsActive.on("message", (d) => {
          const msg = JSON.parse(d.toString());
          if (msg.type === "join.ack") activeJoined = true;
          maybeProceed();
        });

        const fail = (err: any) => {
          clearTimeout(timer);
          reject(err);
        };
        wsIdle.on("error", fail);
        wsActive.on("error", fail);
        wsSpectator.on("error", fail);
      });

      // Post-conditions: we must have seen a leaderboard update only after active disconnect
      const updates = spectatorMsgs.filter((m) => m.type === "leaderboardUpdate.event");
      expect(updates.length).toBeGreaterThan(0);
      const first = updates[0];
      expect(first.protocol_version).toBe("1");
      expect(first.payload.entries.length).toBeGreaterThan(0);
      // Ensure the color from the active player is present in entries
      const hasActiveColor = first.payload.entries.some((e: any) => e.color === "#2299DD");
      expect(hasActiveColor).toBe(true);
    } finally {
      await srv.close();
    }
  });
});
