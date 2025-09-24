// Anti-cheat evaluator (T011)
import type { PhysicsState } from "../physics/integrator.ts";

export interface AntiCheatThresholds {
  max_inputs_per_second: number;
  max_position_delta_px: number;
  consecutive_violation_limit: number;
}

export interface TickContext {
  tick_ms: number;
  inputsThisSecond: number; // running count for current sliding 1s bucket (simplified)
  prevPhysics: PhysicsState;
  physics: PhysicsState;
}

export interface EvaluationResult {
  violation: boolean;
  reason?: "input-rate" | "position-delta";
}

export function evaluate(
  ctx: TickContext,
  thresholds: AntiCheatThresholds,
): EvaluationResult {
  if (ctx.inputsThisSecond > thresholds.max_inputs_per_second) {
    return { violation: true, reason: "input-rate" };
  }
  const dy = Math.abs(ctx.physics.y - ctx.prevPhysics.y);
  const dx = Math.abs(ctx.physics.x - ctx.prevPhysics.x);
  if (
    dy > thresholds.max_position_delta_px ||
    dx > thresholds.max_position_delta_px
  ) {
    return { violation: true, reason: "position-delta" };
  }
  return { violation: false };
}
