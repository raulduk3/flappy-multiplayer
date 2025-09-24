// Physics integrator (T010)
import {
  FLAP_IMPULSE,
  GRAVITY,
  HORIZONTAL_VELOCITY,
  TICK_MS,
} from "../../../../shared/src/physics/constants.ts";

export interface PhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function createInitialPhysics(): PhysicsState {
  return { x: 0, y: 0, vx: HORIZONTAL_VELOCITY, vy: 0 };
}

export function applyFlap(phys: PhysicsState) {
  phys.vy = FLAP_IMPULSE;
}

export function applyTick(phys: PhysicsState) {
  // Integrate velocity then position using simple Euler (sufficient for arcade physics)
  phys.vy += GRAVITY * (TICK_MS / 1000);
  phys.x += phys.vx * (TICK_MS / 1000);
  phys.y += phys.vy * (TICK_MS / 1000);
}
