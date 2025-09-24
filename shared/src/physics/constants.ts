// Physics constants (T003)
// Immutable exported constants used by both server and (future) client for deterministic simulation.

export const TICK_HZ = 60; // simulation frequency
export const TICK_MS = 1000 / TICK_HZ;

export const GRAVITY = 1800; // downward acceleration px/s^2 (tune later)
export const FLAP_IMPULSE = -520; // instantaneous vy set/add (negative = upward)
export const HORIZONTAL_VELOCITY = 160; // constant horizontal velocity px/s

export const PIPE_WEIGHT = 100; // scoring weight for passing a pipe
export const DISTANCE_WEIGHT = 1; // scoring weight for distance traveled

Object.freeze(exports);
