// T054: Engraving immutability enforcement
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import { submitEngraving } from "../../src/server/services/engravingService.ts";
import { runManager } from "../../src/server/services/runManager.ts";

describe("Engraving Immutability (T054)", () => {
  test("second engraving rejected with immutable reason", () => {
    const sent: any[] = [];
    const { player, room } = handleJoin("immuUser", (m) => sent.push(m));
    handleFlap(player, room);
    const run = room.runs.get(player.active_run_id!)!;
    runManager.endRun(run, room, "collision");
    player.endRun();
    const t = Date.now();
    const ok = submitEngraving(run, "AAA", t);
    expect(ok.accepted).toBe(true);
    const second = submitEngraving(run, "BBB", t + 1);
    expect(second.accepted).toBe(false);
    expect(second.reason).toBe("immutable");
  });
});
