// T055: Unique run_id generation integration test
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import { runManager } from "../../src/server/services/runManager.ts";
import { tickOnce } from "../../src/server/sim/tickLoop.ts";

describe("Run ID Uniqueness (T055)", () => {
  test("sequential runs have distinct IDs", () => {
    const sent: any[] = [];
    const { player, room } = handleJoin("uniqUser", (m) => sent.push(m));
    // Run 1
    handleFlap(player, room);
    const run1Id = player.active_run_id!;
    const run1 = room.runs.get(run1Id)!;
    runManager.endRun(run1, room, "collision");
    player.endRun();
    // Advance seq a bit
    for (let i = 0; i < 3; i++) tickOnce("1.0.0");
    // Run 2
    handleFlap(player, room);
    const run2Id = player.active_run_id!;
    expect(run2Id).not.toBe(run1Id);
  });
});
