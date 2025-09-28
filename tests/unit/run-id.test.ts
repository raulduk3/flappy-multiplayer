import { describe, it, expect } from "vitest";
import { newRunId } from "../../src/shared/ids.js";

describe("run_id generator", () => {
  it("generates unique ids across many runs", () => {
    const N = 5000;
    const set = new Set<string>();
    for (let i = 0; i < N; i++) {
      const id = newRunId();
      expect(set.has(id)).toBe(false);
      set.add(id);
    }
    expect(set.size).toBe(N);
  });
});
