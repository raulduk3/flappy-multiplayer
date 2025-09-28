import { describe, it, expect } from "vitest";
import { step } from "../../src/shared/physics.js";
import { PhysicsConstants } from "../../src/shared/constants.js";

describe("physics.step", () => {
  it("applies gravity and flap impulse", () => {
    const dt = 1 / 60;
    const state = { x: 0, y: 0, vx: 0, vy: 0 };
    const afterFlap = step(state, dt, { flap: true });
    expect(afterFlap.vy).toBeLessThan(0); // flap impulse upward
    const afterFall = step(afterFlap, dt * 30, { flap: false });
    expect(afterFall.vy).toBeGreaterThan(afterFlap.vy); // gravity pulls down
    expect(PhysicsConstants.forwardVelocity).toBeGreaterThan(0);
  });
});
