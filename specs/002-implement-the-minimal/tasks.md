# Tasks — Minimal Playable Gameplay Loop (Feature 002)

This tasks list follows TDD and the repository Constitution. Execute in order unless marked [P] for safe parallelization across different files.

## Setup & Scaffolding

- [x] T001: Ensure base deps and scripts exist (Node ≥20, TypeScript ESM, ws, ajv, uuid, pino, vitest, tsx, Next.js). Verify package.json scripts: dev (server via tsx), test, test:watch, client:dev. File: `package.json`.
- [x] T002: Create source structure stubs if missing. Dirs: `src/server`, `src/shared`, `src/client` (Next.js app placeholder), `tests/contract`, `tests/unit`, `tests/integration`.
- [x] T003: Add shared constants and types scaffolding. File: `src/shared/constants.ts`, `src/shared/types.ts`.

## Contract Tests [P]

- [x] T010 [P]: Contract test for join.request against `shared/schemas/protocol/v1/join.request.schema.json`. File: `tests/contract/join.request.schema.test.ts`.
- [x] T011 [P]: Contract test for join.ack against `shared/schemas/protocol/v1/join.ack.schema.json`. File: `tests/contract/join.ack.schema.test.ts`.
- [x] T012 [P]: Contract test for runStart.event against `shared/schemas/protocol/v1/runStart.event.schema.json`. File: `tests/contract/runStart.event.schema.test.ts`.
- [x] T013 [P]: Contract test for input.flap.request against `shared/schemas/protocol/v1/input.flap.request.schema.json`. File: `tests/contract/input.flap.request.schema.test.ts`.
- [x] T014 [P]: Contract test for snapshot.event against `shared/schemas/protocol/v1/snapshot.event.schema.json`. File: `tests/contract/snapshot.event.schema.test.ts`.
- [x] T015 [P]: Contract test for runEnd.event against `shared/schemas/protocol/v1/runEnd.event.schema.json`. File: `tests/contract/runEnd.event.schema.test.ts`.

## Unit Tests (Physics, Seed, IDs) [P]

- [x] T020 [P]: Physics step integration test (gravity, flap impulse, forward velocity). File: `tests/unit/physics.step.test.ts`.
- [x] T021 [P]: Collision detection unit tests (pipe rectangle + bounds). File: `tests/unit/collision.test.ts`.
- [x] T022 [P]: Seeded track generator determinism tests (same seed → identical pipes sequence; change seed → different). File: `tests/unit/track.generator.test.ts`.
- [x] T023 [P]: run_id generator uniqueness tests (high volume, no collisions). File: `tests/unit/run-id.test.ts`.

## Property Tests

- [x] T030: Server vs client track parity property test: same seed and tick produce identical pipe positions/gaps. File: `tests/unit/track.parity.property.test.ts`.

## Integration Tests (User Stories)

- [x] T040: Join→receive joinAck (room_id, seed). File: `tests/integration/join-ack.test.ts`.
- [x] T041: runStart after first flap → run_id assigned. File: `tests/integration/run-start-on-first-flap.test.ts`.
- [x] T042: Flap during run affects y-velocity; physics continues at 60 Hz; snapshots at 45 Hz. File: `tests/integration/flap-physics-snapshot.test.ts`.
- [x] T043: Collision ends run → runEnd received with final stats; player pruned from snapshots. File: `tests/integration/collision-run-end.test.ts`.
- [x] T044: Restart immediately after runEnd → new run_id and fresh state. File: `tests/integration/restart-new-run.test.ts`.

- [x] T045: Two-player room visibility and pruning. Start two clients in one room, assert both appear in snapshots, then one collides and is pruned. File: `tests/integration/multiplayer-visibility.test.ts`.
- [x] T046: Disconnect mid-run finalizes run and prunes player. File: `tests/integration/disconnect-prune.test.ts`.
- [x] T047: Rate limiting: send >5 flaps/sec, assert excess are ignored (no additional physics impulses) and optional server ack/error is consistent. File: `tests/integration/rate-limit.test.ts`.
- [x] T048: Snapshot cadence ≈45 Hz over a short window with tolerance. File: `tests/integration/snapshot-cadence.test.ts`.
- [x] T049: Replay logging fields present for join, runStart, input, snapshot, runEnd. File: `tests/integration/replay-logging-fields.test.ts`.

## Server Implementation

 - [x] T050: Implement shared constants for PhysicsConstants and TrackConfig defaults (gravity, flap_impulse, forward_velocity; initial gap 45%, min 30%, tighten 1%/10s; spacing 1.5s). File: `src/shared/constants.ts`.
 - [x] T051: Implement seeded pipe/track generator with deterministic PRNG; expose getPipesAtTick(seed, tick) and helpers. File: `src/shared/track.ts`.
 - [x] T052: Implement physics module: step(dt, inputFlags) updating position/velocity and computing distance; expose collision check with pipe/bounds. File: `src/shared/physics.ts`.
 - [x] T053: Implement run_id generator (uuid v4 wrapper). File: `src/shared/ids.ts`.
 - [x] T054: Implement Room model with tick loop at 60 Hz and snapshot emission at 45 Hz; manage players, active runs, and pruning ended players. File: `src/server/room.ts`.
 - [x] T055: Implement RoomManager to assign sessions to rooms (capacity 32; spillover creates new room) and route inputs. File: `src/server/roomManager.ts`.
 - [x] T056: Extend WebSocket server to support join/joinAck, input.flap, runStart, snapshot, runEnd messages and logging for replay. File: `src/server/server.ts`.

## Client (Barebones Next.js)

- [x] T060: Scaffold Next.js app under `src/client` with a Game page and Canvas renderer at 60 FPS. File: `src/client` tree.
- [x] T061: Implement seed-based track reconstruction on client to draw pipes; simple rectangles and score text. File: `src/client/lib/track.ts` and components.
- [x] T062: Implement WebSocket client: join on connect, dispatch flap on space/tap, render snapshots, handle runEnd and restart logic. File: `src/client/lib/net.ts` and page code.

## Logging, Observability, Security

- T070: Ensure structured logs include ids (room_id, run_id, session_id), seed, tick, inputs, outcomes; align with replay requirements. Files: `src/server/server.ts`, `src/server/room*.ts`.
- T071: Validate all inbound messages with ajv; enforce 5 flaps/sec per player (ignore excess). Files: `src/server/server.ts`.
- T072: Document WSS for prod and WS for dev in quickstart; ensure no secrets in logs. Files: `specs/002-implement-the-minimal/quickstart.md`.

## Docs & Polish [P]

- T080 [P]: Update `specs/002-implement-the-minimal/quickstart.md` with concrete run steps and troubleshooting after implementation.
- T081 [P]: Add README section for the client Game page and controls.
- T082 [P]: Add comments and inline docs in shared modules for constants and deterministic behavior.

## Parallelization Guidance

- [P] tasks can be executed in parallel by separate agents as they touch different files.
- Recommended parallel batches:
  - Batch A (contracts): T010–T015
  - Batch B (unit tests): T020–T023
  - Batch C (client scaffold + libs): T060–T062 (sequential within client)

## Notes

- Maintain TDD: do not implement a module until its tests exist and fail.
- Protocol schemas are authoritative under `shared/schemas/protocol/v1` per Constitution. The `specs/.../contracts/` copies are documentation-only.

## Additional Unit/Integration Tests

- T024 [P]: Score increments correctly when passing pipes; final_score matches count on runEnd. File: `tests/unit/score.test.ts`.
