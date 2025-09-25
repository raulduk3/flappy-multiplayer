import { predictWithCap, type PhysicsState } from "../../services/prediction";
import { reconcile } from "../../services/reconciliation";

describe("Prediction cap and reconciliation snap (T006)", () => {
  it("caps prediction at 150ms and clamps dt to 50ms chunks", () => {
    const start: PhysicsState = { x: 0, y: 0, vx: 0, vy: 0 };
    const { appliedMs } = predictWithCap(start, 1000, { capMs: 150, clampMs: 50 });
    // Expect cap: should not apply full 1000ms
    expect(appliedMs).toBeLessThanOrEqual(150);
  });

  it("snaps when radial error exceeds 10px", () => {
    const predicted: PhysicsState = { x: 0, y: 0, vx: 0, vy: 0 };
    const authoritative: PhysicsState = { x: 0, y: 11, vx: 0, vy: 0 };
    const { snapped } = reconcile(predicted, authoritative, 10);
    expect(snapped).toBe(true);
  });
});
