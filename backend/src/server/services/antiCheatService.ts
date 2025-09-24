// Anti-cheat service (T024)
import { evaluate } from "../antiCheat/evaluator.ts";
import { Player } from "../models/Player.ts";
import { Room } from "../models/Room.ts";
import { Run } from "../models/Run.ts";
import { runManager } from "./runManager.ts";
import { TICK_MS } from "../../../../shared/src/physics/constants.ts";

export function processAntiCheat(room: Room) {
  for (const p of room.humans.values()) {
    if (p.state !== "active" || !p.active_run_id) continue;
    const run = room.runs.get(p.active_run_id);
    if (!run) continue;
    const thresholds = room.config.anti_cheat;
    // Use stored previous physics snapshot (captured last tick) for delta.
    if (!p.prevPhysics) {
      // Initialize baseline but still allow first evaluation to run using same frame (forces no delta violation).
      p.prevPhysics = { ...p.physics };
    }
    const result = evaluate(
      {
        tick_ms: TICK_MS,
        inputsThisSecond: 0,
        prevPhysics: p.prevPhysics,
        physics: p.physics,
      },
      thresholds,
    );
    // After evaluation, update baseline
    p.prevPhysics = { ...p.physics };
    if (result.violation) {
      p.violation_streak += 1;
      if (p.violation_streak >= thresholds.consecutive_violation_limit) {
        runManager.endRun(run, room, "cheat-removal");
        p.endRun();
      }
    } else {
      p.violation_streak = 0;
    }
  }
}
