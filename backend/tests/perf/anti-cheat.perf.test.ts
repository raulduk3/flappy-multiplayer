// T037: Anti-cheat evaluation latency perf test
import { evaluate } from "../../src/server/antiCheat/evaluator.ts";

function runMany(iter: number) {
  const thresholds = {
    max_inputs_per_second: 8,
    max_position_delta_px: 120,
    consecutive_violation_limit: 3,
  };
  const prev = { x: 0, y: 0, vx: 3, vy: 0 };
  const phys = { x: 0, y: 0, vx: 3, vy: 0 };
  let violations = 0;
  for (let i = 0; i < iter; i++) {
    phys.y += 1; // small movement well under threshold per tick
    const r = evaluate(
      { tick_ms: 16, inputsThisSecond: 0, prevPhysics: prev, physics: phys },
      thresholds,
    );
    // Advance prev to current for next iteration (simulating tick progression)
    prev.x = phys.x;
    prev.y = phys.y;
    if (r.violation) violations++;
  }
  return violations;
}

describe("Perf: Anti-cheat (T037)", () => {
  test("evaluate many iterations under threshold", () => {
    const start = Date.now();
    const v = runMany(50_000);
    const dur = Date.now() - start;
    expect(v).toBe(0);
    // Should complete quickly (< 1s) in typical dev environment; loose upper bound
    expect(dur).toBeLessThan(1500);
  });
});
