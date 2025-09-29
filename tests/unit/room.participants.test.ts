import { describe, it, expect } from "vitest";
import { WebSocket } from "ws";
import { Room } from "../../src/server/room";

function makeWS() {
  // Minimal mock: capture outbound messages
  const sent: any[] = [];
  const ws = {
    send: (s: string) => { sent.push(JSON.parse(s)); },
    close: () => {},
  } as unknown as WebSocket;
  return { ws, sent };
}

describe("Room participants state", () => {
  it("tracks idle on join and becomes active on first flap", async () => {
    const { ws, sent } = makeWS();
    const room = new Room({ id: "r1", seed: "seed", capacity: 32, protocolVersion: "1" });
    room.addSession("s1", ws);
    room.handleJoin("s1", "m1");

    // Wait a tick for first snapshot
    await new Promise((r) => setTimeout(r, 30));

    // Expect snapshot with players empty (no active run yet)
    const snapshot1 = sent.find((m) => m.type === "snapshot.event");
    expect(snapshot1).toBeTruthy();
    expect(snapshot1.payload.players.length).toBe(0);

    // First flap starts the run and sends runStart
    room.handleFlap("s1", "m2");
    await new Promise((r) => setTimeout(r, 30));
    const runStart = sent.find((m) => m.type === "runStart.event");
    expect(runStart).toBeTruthy();

    // Subsequent snapshot should include player in players array
    const snapshot2 = sent.filter((m) => m.type === "snapshot.event").pop();
    expect(snapshot2.payload.players.length).toBeGreaterThan(0);

    room.stop();
  });
});
