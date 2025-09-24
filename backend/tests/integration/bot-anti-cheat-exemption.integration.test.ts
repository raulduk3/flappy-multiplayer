// T056: Bots exempt from anti-cheat removal integration test
import { handleJoin } from "../../src/server/handlers/join.ts";
import { tickOnce } from "../../src/server/sim/tickLoop.ts";
import { runManager } from "../../src/server/services/runManager.ts";

describe("Bot Anti-cheat Exemption (T056)", () => {
  test("bot not removed under large position deltas that remove human", () => {
    const { player, room } = handleJoin("botExemptUser", () => {});
    // spawn bots (already done by join), pick one
    const bot = Array.from(room.bots.values())[0];
    // Manually mark bot as active in a run for this test (since bot controller not starting runs yet)
    bot.active_run_id = "botRun1";
    // Start human run via runManager to ensure prevPhysics baseline
    runManager.startRun(player, room);
    // Force violations on both
    const limit = room.config.anti_cheat.consecutive_violation_limit;
    const jump = room.config.anti_cheat.max_position_delta_px + 80;
    for (let i = 0; i < limit; i++) {
      player.physics.y += jump;
      bot.physics.y += jump; // should not trigger removal path (service only iterates humans)
      tickOnce("1.0.0");
    }
    expect(player.state).toBe("ended");
    // Bot still "active" (no anti-cheat processing)
    expect(bot.active_run_id).toBe("botRun1");
  });
});
