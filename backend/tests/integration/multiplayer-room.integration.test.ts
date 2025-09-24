// T045: Full end-to-end multi-player room test (2 players + bots)
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import { tickOnce } from "../../src/server/sim/tickLoop.ts";

// This test exercises two human players entering the same room and starting runs;
// asserts they share room context and independent runs exist.
describe("Multiplayer room (T045)", () => {
  test("two players share room & independent run state", () => {
    const sentA: any[] = [];
    const sentB: any[] = [];
    const { player: a, room: roomA } = handleJoin("multiA", (m) => sentA.push(m));
    const { player: b, room: roomB } = handleJoin("multiB", (m) => sentB.push(m));
    expect(roomA.room_id).toBe(roomB.room_id);
    // Start runs for both
    handleFlap(a, roomA);
    handleFlap(b, roomB);
    expect(a.active_run_id).toBeTruthy();
    expect(b.active_run_id).toBeTruthy();
    expect(a.active_run_id).not.toBe(b.active_run_id);
    // Advance a few ticks
    for (let i = 0; i < 3; i++) tickOnce("1.0.0");
    // Basic physics divergence (y positions may differ after flaps)
    expect(a.physics.y).not.toBeNaN();
    expect(b.physics.y).not.toBeNaN();
  });
});
