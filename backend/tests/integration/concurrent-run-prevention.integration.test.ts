// T057: Prevent concurrent second run integration test
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import { tickOnce } from "../../src/server/sim/tickLoop.ts";

describe("Concurrent Run Prevention (T057)", () => {
  test("additional flaps while active do not start a new run", () => {
    const sent: any[] = [];
    const { player, room } = handleJoin("dupUser", (m) => sent.push(m));
    handleFlap(player, room); // starts run
    const firstRun = player.active_run_id!;
    for (let i = 0; i < 5; i++) {
      handleFlap(player, room);
      tickOnce("1.0.0");
    }
    expect(player.active_run_id).toBe(firstRun);
    // Ensure only one run object exists
    expect(room.runs.size).toBe(1);
  });
});
