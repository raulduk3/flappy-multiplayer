// Updated T031: Run lifecycle integration test using in-process services
// Validates: join -> flap starts run -> snapshots reflect active player & seq monotonic growth

import { roomRegistry } from "../../src/server/services/roomRegistry.ts";
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import {
  tickOnce,
  startTicks,
  stopTicks,
  registerSnapshotBroadcaster,
} from "../../src/server/sim/tickLoop.ts";

describe("Run Lifecycle Integration (T031)", () => {
  afterEach(() => {
    stopTicks();
  });

  test("player joins idle then flap starts run and appears in snapshot", () => {
    const sent: any[] = [];
    function send(msg: any) {
      sent.push(msg);
    }
    // 1. Join
    const { player, room } = handleJoin("conn1", send);
    expect(sent.find((m) => m.type === "joinAck")).toBeTruthy();
    expect(player.state).toBe("idle");
    // 2. No active runs yet
    expect(room.runs.size).toBe(0);
    // 3. Flap -> should create run
    handleFlap(player, room);
    expect(player.state).toBe("active");
    expect(player.active_run_id).toBeTruthy();
    expect(room.runs.size).toBe(1);
    const runId = player.active_run_id!;
    // 4. Tick a few times collecting snapshots
    const snapshots: any[] = [];
    registerSnapshotBroadcaster((roomId, snap) => {
      if (roomId === room.room_id) snapshots.push(snap);
    });
    for (let i = 0; i < 5; i++) tickOnce("1.0.0");
    expect(snapshots.length).toBeGreaterThanOrEqual(1);
    // 5. Latest snapshot contains active player
    const last = snapshots[snapshots.length - 1];
    expect(last.type).toBe("snapshot");
    expect(
      last.active.find((p: any) => p.id === player.player_id),
    ).toBeTruthy();
    // 6. Seq monotonic
    const seqs = snapshots.map((s) => BigInt(s.seq));
    for (let i = 1; i < seqs.length; i++)
      expect(seqs[i] > seqs[i - 1]).toBe(true);
    // 7. Run still active (no termination logic yet) with same id
    const run = room.runs.get(runId)!;
    expect(run.state).toBe("active");
    expect(run.run_id).toBe(runId);
  });
});
