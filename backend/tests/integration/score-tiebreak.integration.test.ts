// T060: Score tie-break by elapsed_ms integration test
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import { tickOnce } from "../../src/server/sim/tickLoop.ts";
import { runManager } from "../../src/server/services/runManager.ts";

describe("Score Tie-break (T060)", () => {
  test("scoreboard orders by score desc then elapsed_ms asc", () => {
    const sent: any[] = [];
    const { player, room } = handleJoin("tieUser", (m) => sent.push(m));
    // Run A (longer)
    handleFlap(player, room);
    const runAId = player.active_run_id!;
    const runA = room.runs.get(runAId)!;
    // Advance a few ticks to increase elapsed
    for (let i = 0; i < 5; i++) tickOnce("1.0.0");
    runA.score = 10; // direct set for test harness
    runManager.endRun(runA, room, "collision"); // player state auto-ended by manager
    // Run B (shorter elapsed but same score)
    handleFlap(player, room);
    const runBId = player.active_run_id!;
    const runB = room.runs.get(runBId)!;
    runB.score = 10; // same score
    // Fewer ticks to keep elapsed lower
    for (let i = 0; i < 2; i++) tickOnce("1.0.0");
    runManager.endRun(runB, room, "collision");
    // Scoreboard top should have B before A due to lower elapsed_ms
    expect(room.scoreboard.length).toBeGreaterThanOrEqual(2);
    const [first, second] = room.scoreboard;
    expect(first.score).toBe(10);
    expect(second.score).toBe(10);
    expect(first.elapsed_ms).toBeLessThan(second.elapsed_ms);
    expect(first.run_id).toBe(runBId);
    expect(second.run_id).toBe(runAId);
  });
});
