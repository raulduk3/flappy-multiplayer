// T048: Engraving filtering denial cases
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import { runManager } from "../../src/server/services/runManager.ts";
import { submitEngraving } from "../../src/server/services/engravingService.ts";

function finishRun(room: any, player: any) {
  const run = room.runs.get(player.active_run_id!);
  run.score = 5;
  runManager.endRun(run, room, "collision");
  player.endRun();
  return run;
}

describe("Engraving filtering denial (T048)", () => {
  test("too long name rejected (length)", () => {
    const { player, room } = handleJoin("filterUser1", () => {});
    handleFlap(player, room);
    const run = finishRun(room, player);
    const r = submitEngraving(run, "A".repeat(30));
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe("length");
  });
  test("charset invalid rejected", () => {
    const { player, room } = handleJoin("filterUser2", () => {});
    handleFlap(player, room);
    const run = finishRun(room, player);
    const r = submitEngraving(run, "Name@#!");
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe("charset");
  });
  test("deny substring filtered", () => {
    const { player, room } = handleJoin("filterUser3", () => {});
    handleFlap(player, room);
    const run = finishRun(room, player);
    const r = submitEngraving(run, "badwordChamp");
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe("filtered");
  });
});
