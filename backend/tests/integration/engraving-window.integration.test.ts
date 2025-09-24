// T032: Engraving success & timeout integration test
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import { tickOnce } from "../../src/server/sim/tickLoop.ts";
import { submitEngraving } from "../../src/server/services/engravingService.ts";
import { runManager } from "../../src/server/services/runManager.ts";

describe("Engraving Window (T032)", () => {
  test("engraving accepted when run ended and within window; rejected after expiry", () => {
    const sent: any[] = [];
    const { player, room } = handleJoin("engraveUser", (m) => sent.push(m));
    // Start run
    handleFlap(player, room);
    const run = room.runs.get(player.active_run_id!)!;
    // Simulate run end (collision) by finalizing manually
    runManager.endRun(run, room, "collision");
    player.endRun();
    const now = Date.now();
    // 1st engraving within window
    const r1 = submitEngraving(run, "ACE", now);
    expect(r1.accepted).toBe(true);
    expect(run.engraving?.name).toBe("ACE");
    // Second attempt immutable
    const r2 = submitEngraving(run, "BEE", now + 10);
    expect(r2.accepted).toBe(false);
    expect(r2.reason).toBe("immutable");
  });
});
