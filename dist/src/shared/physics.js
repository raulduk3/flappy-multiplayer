import { PhysicsConstants } from "./constants.js";
export function step(state, dt, input) {
    // Placeholder to satisfy tests; real implementation in later tasks
    const g = PhysicsConstants.gravity; // keep in sync with constants during implementation
    let vy = state.vy;
    if (input.flap)
        vy = PhysicsConstants.flapImpulse;
    vy = vy + g * dt;
    return { x: state.x, y: state.y + vy * dt, vx: state.vx, vy };
}
// Placeholder collision functions to be implemented later
export function collidesWithBounds(state, worldHeight) {
    const top = state.y;
    const bottom = state.y + PhysicsConstants.hitbox.height;
    return top < 0 || bottom > worldHeight;
}
export function collidesWithPipe(state, pipeX, pipeWidth, gapCenterY, gapHeight, worldHeight) {
    // First, world bounds
    if (collidesWithBounds(state, worldHeight))
        return true;
    const birdLeft = state.x;
    const birdTop = state.y;
    const birdRight = birdLeft + PhysicsConstants.hitbox.width;
    const birdBottom = birdTop + PhysicsConstants.hitbox.height;
    const gapTop = gapCenterY - gapHeight / 2;
    const gapBottom = gapCenterY + gapHeight / 2;
    // Top pipe rect: from y=0 to gapTop
    const topLeft = pipeX;
    const topTop = 0;
    const topRight = pipeX + pipeWidth;
    const topBottom = Math.max(0, Math.min(gapTop, worldHeight));
    // Bottom pipe rect: from gapBottom to worldHeight
    const botLeft = pipeX;
    const botTop = Math.max(0, Math.min(gapBottom, worldHeight));
    const botRight = pipeX + pipeWidth;
    const botBottom = worldHeight;
    const overlaps = (ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) => ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
    const hitTop = overlaps(birdLeft, birdTop, birdRight, birdBottom, topLeft, topTop, topRight, topBottom);
    const hitBottom = overlaps(birdLeft, birdTop, birdRight, birdBottom, botLeft, botTop, botRight, botBottom);
    return hitTop || hitBottom;
}
