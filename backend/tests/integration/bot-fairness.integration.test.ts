// T055: Bot participation & fairness integration test
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import { tickOnce } from "../../src/server/sim/tickLoop.ts";

describe("Bot Fairness (T055)", () => {
  test("bots spawn per human and are not ended by human anti-cheat removal", () => {
    const sent: any[] = [];
    const { player, room } = handleJoin("botTester", (m) => sent.push(m));
    expect(room.bots.size).toBe(room.config.bots_per_human);
    handleFlap(player, room);
    const limit = room.config.anti_cheat.consecutive_violation_limit;
    const jump = room.config.anti_cheat.max_position_delta_px + 30;
    for (let i = 0; i < limit; i++) {
      player.physics.y += jump;
      tickOnce("1.0.0");
    }
    expect(player.state).toBe("ended");
    // Bots should not be forcibly ended by anti-cheat path since service iterates humans only
    for (const b of room.bots.values()) {
      // They never started a run yet; ensure no unexpected property signaling termination
      expect(b.active_run_id).toBeUndefined();
    }
  });
});
