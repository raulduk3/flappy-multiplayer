// NodeNext requires explicit .js extension for relative ESM imports at runtime.
import { TrackConfig, PhysicsConstants } from "./constants.js";
function xorshift32(seed) {
    let x = seed | 0;
    return () => {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        // Convert to [0,1)
        return (x >>> 0) / 0xffffffff;
    };
}
function seedStringToInt(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
// Deterministic track generator: returns visible pipes near the player's x based on tick
export function getPipesAtTick(seed, tick, opts) {
    const H = opts?.worldHeight ?? 600;
    const spacingS = TrackConfig.spacingSeconds;
    const spacingPx = PhysicsConstants.forwardVelocity * spacingS;
    const pipeWidth = 52;
    // Determine how many pipes have been passed given tick and forward velocity
    const time = tick / 60; // physics Hz for reference
    const defaultDistance = time * PhysicsConstants.forwardVelocity;
    const distance = opts?.baseDistance ?? defaultDistance;
    // Choose index near the pipe whose left edge is at/just ahead of the player's distance.
    // World index i defines x position: x(i) = (i + 1) * spacingPx + initialOffsetPx
    // so i ≈ (distance - initialOffsetPx) / spacingPx - 1.
    //
    // IMPORTANT: We decouple the procedural "generation index" (g) from the world index (i)
    // so that adding initialOffsetPx creates empty runway without advancing the RNG sequence
    // or the difficulty schedule. Concretely, g = i - baseAtZero, where baseAtZero is the
    // world index computed at distance = 0. This makes g start at 0 near the origin and
    // progress independently of the initial horizontal offset.
    const pipeIndexBase = Math.floor((distance - TrackConfig.initialOffsetPx) / spacingPx) - 1;
    const baseAtZero = Math.floor((0 - TrackConfig.initialOffsetPx) / spacingPx) - 1; // index when distance = 0
    // Create RNG seeded by seed + index to get stable per-pipe variations
    const baseSeed = seedStringToInt(seed);
    const results = [];
    const before = Math.max(0, Math.floor(opts?.countBefore ?? 0));
    const after = Math.max(1, Math.floor(opts?.countAfter ?? 3));
    const start = Math.max(0, pipeIndexBase - before);
    // Guarantee we produce some pipes even if the base index is negative (pre-runway)
    const end = Math.max(start + after, pipeIndexBase + after); // exclusive upper bound
    for (let i = start; i < end; i++) {
        const g = i; // generation index starts at 0 for the first real pipe
        const rng = xorshift32(baseSeed ^ (g * 0x9e3779b1));
        // Gap tightening over time is based on generation index
        const seconds = Math.max(0, g * spacingS);
        let gapRatio = TrackConfig.gapInitialRatio -
            TrackConfig.gapTightenPer10s * (seconds / 10);
        gapRatio = Math.max(TrackConfig.gapMinRatio, gapRatio);
        const gapHeight = H * gapRatio;
        // Gap center jitter within bounds [gapHeight/2, H - gapHeight/2]
        const minCenter = gapHeight / 2 + 10;
        const maxCenter = H - gapHeight / 2 - 10;
        const gapCenterY = minCenter + (maxCenter - minCenter) * rng();
        const x = (i + 1) * spacingPx + TrackConfig.initialOffsetPx; // ahead of origin with configurable offset
        results.push({ x, gapCenterY, gapHeight, width: pipeWidth });
    }
    return results;
}
// Helper for consumers to know the horizontal spacing between pipe columns in px
export function getPipeSpacingPx() {
    return PhysicsConstants.forwardVelocity * TrackConfig.spacingSeconds;
}
