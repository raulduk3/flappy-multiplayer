// Updated T034: Snapshot ordering integration test (internal services)
import { roomRegistry } from "../../src/server/services/roomRegistry.ts";
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import {
  tickOnce,
  registerSnapshotBroadcaster,
} from "../../src/server/sim/tickLoop.ts";

describe("Snapshot Ordering Integration (T034)", () => {
  test("seq strictly increases with no duplicates for active run", () => {
    // Prepare player & start run
    const sent: any[] = [];
    const { player, room } = handleJoin("conn_order", (m) => sent.push(m));
    handleFlap(player, room); // start run
    const seqs: bigint[] = [];
    registerSnapshotBroadcaster((roomId, snap) => {
      if (roomId === room.room_id) seqs.push(BigInt(snap.seq));
    });
    for (let i = 0; i < 10; i++) tickOnce("1.0.0");
    expect(seqs.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < seqs.length; i++)
      expect(seqs[i] > seqs[i - 1]).toBe(true);
    // No duplicates set size == length
    expect(new Set(seqs).size).toBe(seqs.length);
  });
});
