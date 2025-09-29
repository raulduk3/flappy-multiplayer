// Physics and gameplay constants.
//
// Notes on determinism and tests:
// - Values here are intentionally tuned to satisfy the physics, collision, and
//   snapshot cadence tests in this feature. Changing them may break tests and
//   client/server parity property checks.
// - Snapshot cadence is implemented via timers in the Room (server) at ~22ms
//   (~45 Hz). RoomConfig.snapshotHz is a documentation hint, not a source of
//   truth for timers.
export const PhysicsConstants = {
  gravity: 820, // px/s^2
  flapImpulse: -280, // px/s applied to vy
  forwardVelocity: 140, // px/s along x for distance computation
  hitbox: { width: 24, height: 18 },
} as const;

export const TrackConfig = {
  gapInitialRatio: 0.45,
  gapTightenPer10s: 0.1,
  gapMinRatio: 0.3,
  // Horizontal spacing between pipe columns as seconds of forward travel.
  // This is multiplied by forwardVelocity to get actual pixels-per-column.
  // Keep in sync with tests and the client’s track reconstruction logic.
  spacingSeconds: 2.5,
  // Extra initial horizontal space before the first pipe appears (in px)
  initialOffsetPx: 75,
} as const;

export const RoomConfig = {
  capacity: 32,
  physicsHz: 60,
  // Informational only: server uses a ~22ms interval for snapshots (~45 Hz).
  snapshotHz: 45,
} as const;
