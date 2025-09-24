// T046: p95 input-to-effect latency measurement harness (synthetic)
// NOTE: This is a lightweight synthetic metric; not a strict perf gate.
import { handleJoin } from "../../src/server/handlers/join.ts";
import { handleFlap } from "../../src/server/handlers/flap.ts";
import { tickOnce } from "../../src/server/sim/tickLoop.ts";

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function p95(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor(0.95 * (sorted.length - 1));
  return sorted[idx];
}

describe("Input latency synthetic (T046)", () => {
  const ITER = 60;
  test("synthetic input->tick latency p95 < 20ms", () => {
    const sent: any[] = [];
    const { player, room } = handleJoin("latencyUser", (m) => sent.push(m));
    const deltas: number[] = [];
    for (let i = 0; i < ITER; i++) {
      const t0 = performance.now();
      handleFlap(player, room); // registers flap + may start run
      tickOnce("1.0.0");
      const t1 = performance.now();
      deltas.push(t1 - t0);
    }
    const med = median(deltas);
    const p95v = p95(deltas);
    // Loose thresholds: synthetic single-thread loop should be very fast locally.
    expect(med).toBeLessThan(10);
    expect(p95v).toBeLessThan(20);
  });
});
