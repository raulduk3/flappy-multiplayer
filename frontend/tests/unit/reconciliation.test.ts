import { reconcile } from "../../services/reconciliation";

describe("reconciliation snap threshold", () => {
  it("does not snap when error <= threshold", () => {
    const pred = { x: 0, y: 0, vx: 0, vy: 0 };
    const auth = { x: 6, y: 8, vx: 0, vy: 0 }; // 10px
    const r = reconcile(pred, auth, 10);
    expect(r.snapped).toBe(false);
  });
  it("snaps when error > threshold", () => {
    const pred = { x: 0, y: 0, vx: 0, vy: 0 };
    const auth = { x: 7, y: 8, vx: 0, vy: 0 }; // ~10.63
    const r = reconcile(pred, auth, 10);
    expect(r.snapped).toBe(true);
  });
});
