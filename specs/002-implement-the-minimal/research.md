# Research — Minimal Playable Gameplay Loop

Date: 2025-09-27
Branch: 002-implement-the-minimal
Input: specs/002-implement-the-minimal/spec.md

## Decisions

- Snapshot cadence: 45 Hz
- Room capacity: 32 players
- Input rate limit: 5 flaps/sec per player (1s sliding window, ignore excess)
- Late join: run begins on first flap
- Track difficulty: start gap 45% height, tighten 1 percentage point every 10s
- Pipe spacing cadence: every 1.5 seconds (baseline)
- Minimum gap clamp: 30% height (floor)
- Room assignment policy: spillover to a new room when full (each room has its own seed)
- Latency budget: p95 input→visible ≤150 ms (client interpolation permitted)

## Rationale

- 45 Hz snapshots balance bandwidth with responsiveness while physics runs at 60 Hz.
- 32 players/room is a pragmatic cap for a minimal MVP and keeps canvas rendering readable.
- 5 flaps/sec discourages spam while remaining responsive.
- First-flap start simplifies UX and avoids idle auto-start confusion.
- Difficulty ramp (gap tightening) provides gradual challenge without extra content.
- 1.5s spacing gives players reaction time; floor at 30% prevents impossible gaps.
- Spillover rooms maintain low contention and simple routing.
- 150 ms p95 ensures inputs feel responsive with interpolation.

## Alternatives Considered

- Snapshot at 60 Hz: better fidelity but higher bandwidth and CPU.
- Capacity 64: more chaotic visuals and higher server load per room.
- Unlimited flaps: requires complex anti-cheat; noisy inputs.
- Auto-start on join: surprising for users; worse onboarding.
- Randomized spacing: harder to tune; we prefer deterministic tests.

## Open Items (None Blocking)

- Visual polish (skins, animations) — out of scope.
- Persistence/leaderboards — out of scope.
