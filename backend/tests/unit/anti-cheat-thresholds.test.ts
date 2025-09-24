// T062: Anti-cheat thresholds exposed & sane
import { DEFAULT_ROOM_CONFIG } from "../../src/server/config/roomConfig.ts";

describe("AntiCheat Thresholds (T062)", () => {
  test("values exist and within expected ranges", () => {
    const ac = DEFAULT_ROOM_CONFIG.anti_cheat;
    expect(ac.max_inputs_per_second).toBeGreaterThanOrEqual(4);
    expect(ac.max_inputs_per_second).toBeLessThanOrEqual(16);
    expect(ac.max_position_delta_px).toBeGreaterThan(10);
    expect(ac.consecutive_violation_limit).toBeGreaterThan(0);
  });
  test("exact default values & immutability", () => {
    const ac = DEFAULT_ROOM_CONFIG.anti_cheat;
    expect(ac.max_inputs_per_second).toBe(8);
    expect(ac.max_position_delta_px).toBe(120);
    expect(ac.consecutive_violation_limit).toBe(3);
    // Attempt mutation inside try (should throw or be ignored) but not fail test
    let threw = false;
    try {
      (ac as any).max_inputs_per_second = 999;
    } catch {
      threw = true;
    }
    expect(ac.max_inputs_per_second).toBe(8);
    expect(threw || ac.max_inputs_per_second === 8).toBe(true);
  });
});
