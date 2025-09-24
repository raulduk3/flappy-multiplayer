// T033: Anti-cheat violation streak removal (placeholder)
// T033: Anti-cheat removal integration test
// Strategy: Join -> start run -> manually mutate player physics to exceed max_position_delta_px across consecutive ticks
// T033: Anti-cheat violation streak removal integration test
// Strategy: Join -> start run -> manually mutate player physics to exceed max_position_delta_px across consecutive ticks
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import {
  tickOnce,
  registerSnapshotBroadcaster,
} from "../../src/server/sim/tickLoop.ts";
import { roomRegistry } from "../../src/server/services/roomRegistry.ts";

describe("Anti-cheat Removal (T033)", () => {
  test("player run ends with cheat-removal after consecutive violations", () => {
    const sent: any[] = [];
    const { player, room } = handleJoin("cheater", (m) => sent.push(m));
    handleFlap(player, room); // start run
    expect(player.active_run_id).toBeTruthy();
    const runId = player.active_run_id!;
    const run = room.runs.get(runId)!;
    const limit = room.config.anti_cheat.consecutive_violation_limit;
    // Force violations: each tick set position jump beyond threshold
    const jump = room.config.anti_cheat.max_position_delta_px + 50;
    let snapshots: any[] = [];
    registerSnapshotBroadcaster((roomId, snap) => {
      if (roomId === room.room_id) snapshots.push(snap);
    });
    for (let i = 0; i < limit; i++) {
      // mutate physics drastically BEFORE tick so delta is large after integration (or direct difference)
      player.physics.y += jump;
      tickOnce("1.0.0");
    }
    // After limit ticks, run should be ended
    const endedRun = room.runs.get(runId)!;
    expect(endedRun.state).toBe("ended");
    expect(endedRun.termination_cause).toBe("cheat-removal");
    expect(player.state).toBe("ended");
  });
});
