// Physics and gameplay constants (initial defaults; tuned in tests)
export const PhysicsConstants = {
    gravity: 620, // px/s^2
    flapImpulse: -180, // px/s applied to vy
    forwardVelocity: 140, // px/s along x for distance computation
    hitbox: { width: 24, height: 18 },
};
export const TrackConfig = {
    gapInitialRatio: 0.45,
    gapTightenPer10s: 0.01,
    gapMinRatio: 0.3,
    spacingSeconds: 3.4,
    // Extra initial horizontal space before the first pipe appears (in px)
    initialOffsetPx: 75,
};
export const RoomConfig = {
    capacity: 32,
    physicsHz: 60,
    snapshotHz: 60,
};
