export interface PhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PredictOptions {
  capMs?: number; // default 150
  clampMs?: number; // default 50
}

// Integrate physics with delta clamp and overall prediction cap
export function predictWithCap(
  state: PhysicsState,
  dtMs: number,
  opts: PredictOptions = {},
): { state: PhysicsState; appliedMs: number } {
  const g = 0.0012; // gravity px/ms^2 (placeholder, tuned later)
  const cap = Math.max(0, opts.capMs ?? 150);
  const clamp = Math.max(1, opts.clampMs ?? 50);
  const s: PhysicsState = { ...state };

  let remaining = Math.min(dtMs, cap);
  let applied = 0;
  while (remaining > 0) {
    const step = Math.min(remaining, clamp);
    // semi-implicit Euler integration for the step
    s.vy += g * step;
    s.y += s.vy * step;
    s.x += s.vx * step;
    applied += step;
    remaining -= step;
  }
  return { state: s, appliedMs: applied };
}
