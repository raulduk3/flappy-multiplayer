import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";

// T050: Leaderboard update emitted on run end

describe("integration: leaderboard update on runEnd", () => {
  it("broadcasts leaderboardUpdate.event with the finisher entry", async () => {
    const srv = await startServer({ port: 0 });
    const url = `ws://localhost:${srv.port}`;

    try {
      const playerColor = "#77AA33";
      const spectatorMessages: any[] = [];

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("timeout waiting for leaderboard update")),
          8000,
        );

        const wsPlayer = new WebSocket(url);
        const wsSpectator = new WebSocket(url);

        let spectatorJoined = false;
        let playerJoined = false;
        let playerStarted = false;

        function maybeStart() {
          if (spectatorJoined && playerJoined && !playerStarted) {
            playerStarted = true;
            // Start the player's run then force a quick collision via rapid flaps
            setTimeout(() => {
              let count = 0;
              const burst = setInterval(() => {
                if (count++ > 10) {
                  clearInterval(burst);
                  return;
                }
                wsPlayer.send(
                  JSON.stringify({
                    protocol_version: "1",
                    type: "input.flap.request",
                    payload: {},
                  }),
                );
              }, 10);
            }, 50);
          }
        }

        wsPlayer.on("open", () => {
          wsPlayer.send(
            JSON.stringify({
              protocol_version: "1",
              type: "join.request",
              payload: { color: playerColor },
            }),
          );
        });
        wsSpectator.on("open", () => {
          wsSpectator.send(
            JSON.stringify({
              protocol_version: "1",
              type: "join.request",
              payload: {},
            }),
          );
        });

        wsSpectator.on("message", (data) => {
          const msg = JSON.parse(data.toString());
          spectatorMessages.push(msg);
          if (msg.type === "join.ack") {
            spectatorJoined = true;
            maybeStart();
          }
          if (msg.type === "leaderboardUpdate.event") {
            // We can resolve as soon as we see a leaderboard update
            clearTimeout(timer);
            wsPlayer.close();
            wsSpectator.close();
            resolve();
          }
        });

        wsPlayer.on("message", (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.type === "join.ack") {
            playerJoined = true;
            // Kick off a single flap to start run a bit earlier
            setTimeout(() => {
              wsPlayer.send(
                JSON.stringify({
                  protocol_version: "1",
                  type: "input.flap.request",
                  payload: {},
                }),
              );
            }, 50);
            maybeStart();
          }
        });

        const fail = (err: any) => {
          clearTimeout(timer);
          reject(err);
        };
        wsPlayer.on("error", fail);
        wsSpectator.on("error", fail);
      });

      // Validate that spectator observed a leaderboard update with the player's color
      const updates = spectatorMessages.filter((m) => m.type === "leaderboardUpdate.event");
      expect(updates.length).toBeGreaterThan(0);
      const latest = updates[updates.length - 1];
      expect(latest.protocol_version).toBe("1");
      expect(latest.payload).toBeDefined();
      expect(typeof latest.payload.room_id).toBe("string");
      expect(Array.isArray(latest.payload.entries)).toBe(true);
      expect(latest.payload.entries.length).toBeGreaterThanOrEqual(1);
      const entry = latest.payload.entries[0];
      expect(entry).toBeDefined();
      expect(entry.color).toBe(playerColor);
      expect(typeof entry.score).toBe("number");
      expect(typeof entry.ended_at).toBe("number");
    } finally {
      await srv.close();
    }
  });
});
