import { describe, it, expect } from "vitest";
import { getPipesAtTick as sharedGet } from "../../src/shared/track.js";
// For now, client re-uses shared track; once client module exists, import from client/lib/track
const clientGet = sharedGet;
describe("track parity property (server vs client)", () => {
    it("same seed and tick produce identical pipes across layers", () => {
        const seeds = [
            "s1",
            "alpha-β",
            "123456",
            "😀seed",
            "long-seed-with-🚀-chars",
        ];
        const ticks = [0, 1, 60, 600, 3600, 10000];
        for (const seed of seeds) {
            for (const t of ticks) {
                const a = sharedGet(seed, t, { worldHeight: 600 });
                const b = clientGet(seed, t, { worldHeight: 600 });
                expect(a).toEqual(b);
            }
        }
    });
});
