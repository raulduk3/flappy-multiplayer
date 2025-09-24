// Room configuration defaults (T004)
// Central source for room limits and anti-cheat thresholds.

export interface AntiCheatConfig {
  max_inputs_per_second: number; // > this within rolling 1s = violation
  max_position_delta_px: number; // per-tick absolute delta threshold
  consecutive_violation_limit: number; // removal when reached
}

export interface RoomConfig {
  max_humans: number;
  bots_per_human: number;
  tick_hz: number;
  pipe_weight: number;
  distance_weight: number;
  engraving_window_ms: number; // allowed post-run engraving window
  anti_cheat: AntiCheatConfig;
}

export const DEFAULT_ROOM_CONFIG: RoomConfig = Object.freeze({
  max_humans: 20,
  bots_per_human: 3,
  tick_hz: 60,
  pipe_weight: 100,
  distance_weight: 1,
  engraving_window_ms: 120_000,
  anti_cheat: Object.freeze({
    max_inputs_per_second: 8,
    max_position_delta_px: 120,
    consecutive_violation_limit: 3,
  }),
});

export function cloneRoomConfig(): RoomConfig {
  // Provide a shallow clone so tests can mutate safely if needed
  const ac = { ...DEFAULT_ROOM_CONFIG.anti_cheat };
  return { ...DEFAULT_ROOM_CONFIG, anti_cheat: ac };
}
