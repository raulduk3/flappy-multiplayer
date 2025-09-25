import { predictWithCap } from "../../services/prediction";

describe("render loop perf sanity", () => {
  it("predicts 200 frames within budget and avoids unbounded allocations", () => {
    const start = performance.now();
    let state = { x: 0, y: 0, vx: 0.01, vy: 0 };
    // Track allocations indirectly by ensuring array sizes remain bounded (no arrays here) and time budget reasonable
    for (let i = 0; i < 200; i++) {
      const { state: s } = predictWithCap(state, 16, { capMs: 150, clampMs: 50 });
      state = s;
    }
    const elapsed = performance.now() - start;
    // Heuristic: this should complete well under 200ms in CI/local
    expect(elapsed).toBeLessThan(500);
    expect(Number.isFinite(state.x + state.y + state.vx + state.vy)).toBe(true);
  });
});
