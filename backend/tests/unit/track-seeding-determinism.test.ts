// T063: Deterministic Track Seeding
import { generatePipeWindow } from "../../../shared/src/track/seed.ts";

function collectWindows(seed: bigint, count: number) {
  const out: ReturnType<typeof generatePipeWindow>[] = [];
  for (let i = 0; i < count; i++) out.push(generatePipeWindow(seed, i));
  return out;
}

describe("Track Seeding Determinism (T063)", () => {
  test("same seed yields same sequence", () => {
    const a = collectWindows(123n, 20);
    const b = collectWindows(123n, 20);
    expect(b).toEqual(a);
    // Explicit first window snapshot (acts as canary; update intentionally if generation logic changes)
    expect(a[0]).toEqual({
      id: 0,
      x: 0,
      gap_y: expect.any(Number),
      gap_height: expect.any(Number),
    });
  });

  test("different seed diverges early", () => {
    const a = collectWindows(123n, 5);
    const b = collectWindows(124n, 5);
    expect(b).not.toEqual(a);
    // At least one field differs in first window
    const diff = a[0].gap_y !== b[0].gap_y || a[0].x !== b[0].x;
    expect(diff).toBe(true);
  });
});
