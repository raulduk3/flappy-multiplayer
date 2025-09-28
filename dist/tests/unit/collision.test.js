import { describe, it, expect } from "vitest";
import { PhysicsConstants } from "../../src/shared/constants.js";
import { collidesWithBounds, collidesWithPipe, } from "../../src/shared/physics.js";
describe("collision detection", () => {
    const H = 600; // world height
    const pipeX = 300;
    const pipeWidth = 52;
    const gapRatio = 0.4;
    const gapHeight = H * gapRatio;
    const gapCenterY = H / 2; // centered
    it("no collision when inside gap", () => {
        const bird = {
            x: pipeX - 10,
            y: gapCenterY - PhysicsConstants.hitbox.height / 2,
            vx: 0,
            vy: 0,
        };
        const hit = collidesWithPipe(bird, pipeX, pipeWidth, gapCenterY, gapHeight, H);
        expect(hit).toBe(false);
    });
    it("collides with top pipe when above gap", () => {
        const y = gapCenterY - gapHeight / 2 - PhysicsConstants.hitbox.height + 2; // overlap a bit
        const bird = { x: pipeX - 5, y, vx: 0, vy: 0 };
        const hit = collidesWithPipe(bird, pipeX, pipeWidth, gapCenterY, gapHeight, H);
        expect(hit).toBe(true);
    });
    it("collides with world bounds (top/bottom)", () => {
        // Top
        expect(collidesWithBounds({ x: 0, y: -1, vx: 0, vy: 0 }, H)).toBe(true);
        // Bottom
        const bottomY = H - PhysicsConstants.hitbox.height + 1;
        expect(collidesWithBounds({ x: 0, y: bottomY, vx: 0, vy: 0 }, H)).toBe(true);
        // Safe inside
        expect(collidesWithBounds({ x: 0, y: H / 2, vx: 0, vy: 0 }, H)).toBe(false);
    });
});
