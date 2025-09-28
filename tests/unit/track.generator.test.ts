import { describe, it, expect } from "vitest";
import { getPipesAtTick } from "../../src/shared/track.js";

describe("track generator determinism", () => {
  it("same seed and tick produce identical pipe specs", () => {
    const seed = "seed-123";
    const a = getPipesAtTick(seed, 100, { worldHeight: 600 });
    const b = getPipesAtTick(seed, 100, { worldHeight: 600 });
    expect(a).toEqual(b);
  });

  it("different seeds produce different sequences", () => {
    const a = getPipesAtTick("seed-1", 200, { worldHeight: 600 });
    const b = getPipesAtTick("seed-2", 200, { worldHeight: 600 });
    // Not strictly guaranteed for stub, but real impl should differ; write as property: usually different
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b));
  });
});
