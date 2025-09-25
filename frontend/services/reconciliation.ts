import type { PhysicsState } from "./prediction";

export interface ReconcileResult {
  reconciled: PhysicsState;
  snapped: boolean;
  errorPx: number;
}

// Stub: returns authoritative state directly, no snap logic yet.
export function reconcile(
  predicted: PhysicsState,
  authoritative: PhysicsState,
  snapThresholdPx: number,
): ReconcileResult {
  const dx = authoritative.x - predicted.x;
  const dy = authoritative.y - predicted.y;
  const errorPx = Math.hypot(dx, dy);
  const snapped = errorPx > snapThresholdPx;
  // When snapping, immediately adopt authoritative state; otherwise allow smoothing (future work)
  const reconciled = snapped ? { ...authoritative } : { ...authoritative };
  return { reconciled, snapped, errorPx };
}
