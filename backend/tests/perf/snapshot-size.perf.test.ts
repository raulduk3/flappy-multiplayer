// T036: Snapshot size & build time measurement
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import {
  tickOnce,
  registerSnapshotBroadcaster,
} from "../../src/server/sim/tickLoop.ts";
import { tickMetrics } from "../../src/server/metrics/tickMetrics.ts";

describe("Perf: Snapshot Size (T036)", () => {
  test("collect snapshot metrics over N ticks", () => {
    const sent: any[] = [];
    const { player, room } = handleJoin("perfUser", (m) => sent.push(m));
    handleFlap(player, room);
    const snaps: any[] = [];
    registerSnapshotBroadcaster((roomId, snap) => {
      snaps.push(snap);
    });
    for (let i = 0; i < 20; i++) tickOnce("1.0.0");
    const m = tickMetrics.snapshot();
    expect(m.ticks).toBeGreaterThan(0);
    expect(m.last_snapshot_bytes).toBeGreaterThan(0);
  });
});
