// T047: Disconnection cause run termination
// Since full WS stack with real connection lifecycle isn't in-process here,
// we simulate a 'disconnect' by calling runManager.endRun with cause 'disconnect'.
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import { runManager } from "../../src/server/services/runManager.ts";

// Utility to locate current run
function getActiveRun(room: any, player: any) {
  return room.runs.get(player.active_run_id!);
}

describe("Disconnect termination (T047)", () => {
  test("run ends with cause disconnect", () => {
    const sent: any[] = [];
    const { player, room } = handleJoin("discUser", (m) => sent.push(m));
    handleFlap(player, room);
    const run = getActiveRun(room, player)!;
    expect(run.state).toBe("active");
  runManager.endRun(run, room, "disconnect");
  expect(run.state).toBe("ended");
  expect(run.termination_cause).toBe("disconnect");
  });
});
