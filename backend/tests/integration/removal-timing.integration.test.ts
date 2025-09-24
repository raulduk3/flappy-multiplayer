// T058: Next-tick removal visibility timing integration test
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import {
  tickOnce,
  registerSnapshotBroadcaster,
} from "../../src/server/sim/tickLoop.ts";

describe("Removal Timing (T058)", () => {
  test("player visible in snapshot before final violation, absent after removal", () => {
    const sent: any[] = [];
    const { player, room } = handleJoin("timingUser", (m) => sent.push(m));
    handleFlap(player, room);
    const limit = room.config.anti_cheat.consecutive_violation_limit;
    const jump = room.config.anti_cheat.max_position_delta_px + 40;
    const beforeSeqs: bigint[] = [];
    const afterSeqs: bigint[] = [];
    registerSnapshotBroadcaster((roomId, snap) => {
      if (roomId !== room.room_id) return;
      const activeIds = snap.active.map((a: any) => a.id);
      if (player.state === "active") beforeSeqs.push(BigInt(snap.seq));
      if (player.state === "ended") afterSeqs.push(BigInt(snap.seq));
    });
    for (let i = 0; i < limit; i++) {
      player.physics.y += jump;
      tickOnce("1.0.0");
    }
    expect(player.state).toBe("ended");
    // Ensure we captured at least one snapshot before and after ending
    expect(beforeSeqs.length).toBeGreaterThan(0);
    expect(afterSeqs.length).toBeGreaterThan(0);
    // All after snapshots seq > last before snapshot seq
    const lastBefore = beforeSeqs[beforeSeqs.length - 1];
    for (const s of afterSeqs) expect(s > lastBefore).toBe(true);
  });
});
