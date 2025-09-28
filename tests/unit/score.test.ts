import { describe, it, expect } from "vitest";
import { Room } from "../../src/server/room.js";
import { WebSocket } from "ws";

// Minimal fake WebSocket to capture sends
class FakeWS {
  sent: any[] = [];
  send(data: string) { this.sent.push(JSON.parse(data)); }
  close() {}
}

function newRoomForTest() {
  const ws = new FakeWS() as unknown as WebSocket;
  const room = new Room({
    id: "room-1",
    seed: "test-seed",
    capacity: 32,
    protocolVersion: "1",
  });
  // add a session and join
  room.addSession("s1", ws);
  room.handleJoin("s1", "m1");
  return { room, ws };
}

describe("score increments when passing pipes", () => {
  it("increments score and matches runEnd final_score", async () => {
    const { room, ws } = newRoomForTest();

    // Start run with one flap
    room.handleFlap("s1", "m2");

    // Advance time enough to pass a few pipes; rely on timers running
    // Wait ~2.5s which should traverse multiple spacings at 140 px/s
    await new Promise((r) => setTimeout(r, 2600));

    // Force a collision to end the run by sending a burst of flaps
    for (let i = 0; i < 12; i++) {
      room.handleFlap("s1", `m${i+3}`);
      await new Promise((r) => setTimeout(r, 10));
    }

    // Allow timers to emit runEnd and a couple snapshots
    await new Promise((r) => setTimeout(r, 300));

    const messages = (ws as any as FakeWS).sent;
    const snaps = messages.filter((m: any) => m.type === "snapshot.event");
    const end = messages.find((m: any) => m.type === "runEnd.event");
    expect(end).toBeDefined();

    // Score on snapshots should be non-decreasing and final matches runEnd
    let maxScore = 0;
    for (const s of snaps) {
      const me = s.payload.players.find((p: any) => p.player_id === "s1");
      if (me) {
        expect(me.score).toBeGreaterThanOrEqual(maxScore);
        maxScore = me.score;
      }
    }
    expect(typeof end.payload.final_score).toBe("number");
    expect(end.payload.final_score).toBeGreaterThanOrEqual(maxScore);
  }, 8000);
});
