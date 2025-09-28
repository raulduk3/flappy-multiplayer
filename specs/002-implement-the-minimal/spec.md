# Feature Specification: Minimal Playable Gameplay Loop

**Feature Branch**: `002-implement-the-minimal`  
**Created**: 2025-09-27  
**Status**: Draft  
**Input**: User description: "Implement the minimal playable game loop with rooms, run_ids, seeded tracks, and barebones client rendering. The server manages rooms, each with its own tick loop, physics state, deterministic track seed, and run_ids for players. When a player connects, they are assigned to a room and may immediately start a run. The server assigns a run_id, emits runStart, accepts flap inputs, simulates physics at 60 Hz (gravity, flap impulse, forward velocity, collision detection), and applies the seeded track. Distance is forward travel and score is the number of pipes passed. Snapshots contain tick, seed, and active player states (position, velocity, status, distance, score, run_id). Clients reconstruct pipes locally from seed and tick. On collision the server emits runEnd with run_id, finalizes that player’s state, and prunes them from snapshots. The barebones client is a Next.js app with a Canvas 2D render loop at 60 FPS, drawing rectangles for pipes and players and text for scores—no images or graphics. After runEnd the player can immediately start a new run with a new run_id. Acceptance: fake client can join, receive seed, start a run, flap, collide, receive runEnd, and restart. Barebones client can render track and players in Canvas."

## Clarifications

### Session 2025-09-27

- Q: What baseline difficulty profile for the seeded pipe generator? → A: Start easy: 45% gap, tighten 1% every 10s
- Decision: Minimum gap size is clamped at 30% of playfield height; pipe spacing cadence is every 1.5 seconds at constant forward velocity.
- Decision: When a room reaches 32 players, new connections spill over to a new room.
- Decision: Run starts on the first flap; no auto-start timer. Idle players simply fall until collision if they never flap.
- Decision: Inputs are applied at the next server tick in arrival order; clients do not send timestamps beyond the envelope.

## User Scenarios & Testing

1. Join and start on first flap

- Given a new connection, when the server assigns a room and sends join.ack with room_id and seed, then on the player’s first flap the server emits runStart.event with run_id, and the client begins rendering.

2. Flap physics and snapshots

- Given an active run, when the player sends flap inputs, then the server applies them at the next 60 Hz tick, and the client receives snapshots at ~45 Hz reflecting updated position/velocity.

3. Collision ends run

- Given an active run, when the avatar collides with a pipe or bounds, then the server emits runEnd.event with final_distance and final_score, and the player is removed from subsequent snapshots.

4. Restart immediately

- Given a completed run, when the player flaps again, then a new run_id is issued and state resets; prior run state does not leak.

5. Multi-player visibility

- Given two players in the same room, when snapshots arrive, then each client can render both players’ avatars and scores; when one ends, that player is pruned from snapshots.

6. Disconnect mid-run

- Given an active run, when the player disconnects, then the server finalizes the run (runEnd emitted) and removes the player from snapshots.
- **FR-001**: The system MUST organize connected players into “rooms,” each room sharing the same deterministic track seed and tick timeline.
- **FR-002**: Upon connection, a player MUST be assigned to a room and can start a run immediately; the player’s run begins on the first flap input (no lobby requirement).
- **FR-003**: Each run MUST be identified by a unique run_id associated with the player and room at the time of start.
- **FR-004**: The system MUST emit a runStart event at the beginning of each run, including the run_id and the necessary context for the client to render and simulate locally (e.g., seed reference, starting position/state).
- **FR-005**: The system MUST accept player flap inputs during a run and apply them on the server’s authoritative simulation at the next appropriate tick.
- **FR-006**: Each room MUST simulate the game physics at 60 Hz, including gravity, flap impulse, constant forward velocity, and collision detection against the deterministic track and world bounds.
- **FR-007**: Distance MUST be defined as forward travel along the track; score MUST be the number of pipes successfully passed.
- **FR-008**: The system MUST regularly broadcast authoritative snapshots for each room containing: current tick, room seed, and the set of active player states (position, velocity, status, distance, score, run_id). Players who have ended runs MUST be excluded from subsequent snapshots.
- **FR-009**: Clients MUST reconstruct the track (pipe positions/gaps) locally from the provided seed and tick progression; the server MUST NOT send pipe geometry in normal operation.
- **FR-010**: On server-detected collision for a player, the system MUST end that player’s run and emit a runEnd event including the run_id and final stats (distance, score, reason/status).
- **FR-011**: After runEnd, the player MUST be able to immediately start a new run that receives a new run_id; previous state MUST NOT affect the new run.
- **FR-012**: The barebones client MUST render a simple 2D view of the track (pipes) and players at a smooth frame rate, displaying current score and distance as text. No images/graphics beyond basic shapes and text.
- **FR-013**: The system MUST support multiple concurrent players within the same room, showing their avatars and scores in snapshots so clients can render them.
- **FR-014**: All protocol updates for this feature MUST be additive and conform to the existing versioned protocol; messages MUST include necessary identifiers to correlate runs and snapshots (room_id, run_id, player/session id, tick, seed reference).
- **FR-015**: The system MUST log interactions sufficient for deterministic replay and auditing, including timestamps, ids (room_id, run_id, session/player id), seed, tick numbers, inputs, and outcomes.
- **FR-016**: Inputs MUST be validated and rate-limited to 5 flaps per second per player; inputs beyond the limit within any 1s sliding window are ignored.
- **FR-017**: Players who disconnect mid-run MUST have their run finalized (ended) and be removed from snapshots; reconnecting later MUST start a new run_id.
- **FR-018**: Rooms MUST cap at 32 concurrent players per room. Assignment policy: spillover creates/assigns to a new room when capacity is reached.
- **FR-019**: The system MUST broadcast room snapshots to clients at 45 Hz; clients are expected to render smoothly between snapshots.
- **FR-020**: Accessibility MUST include keyboard (and/or tap/click) control for flap, high-contrast visuals for readability, and on-screen text labels for score and distance.
- **FR-021**: Production deployment MUST use secure transport and input validation; development may use non-secure transport consistent with prior policy.

## Key Entities

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

Constitution alignment (v1.0.0):

- Protocol updates MUST extend `shared/schemas/protocol/v1` rather than fork it
- Server remains authoritative; client changes are rendering/UI only
- New interactions MUST state replay logging fields (ids, timestamps, seeds)
- **Room**: A shared simulation space with id, deterministic seed, tick counter, and a set of connected players; governs physics loop and snapshot emission.
- **Run**: A player-at-a-time attempt through the track, identified by run_id; has start/end ticks, final stats, status (active/ended), and linkage to room and player.
- **Player/Session**: The connected participant with a stable session identifier; may start multiple runs over time; appears in snapshots only while active in a run.
- **Snapshot**: A periodic authoritative summary including tick, seed, and active player states (position, velocity, status, distance, score, run_id) for the room.
- **Track**: A deterministic sequence of obstacles (pipes) derived from a seed and tick progression; identical across clients in the same room.
- **Input**: Player actions (flap) annotated with sufficient timing/ordering to apply deterministically to the server’s ticks.

### Entities

- Room: id, seed, tick counter, connected players
- Run: run_id, start_tick, end_tick, final stats, status (active/ended), player linkage
- Player/Session: stable session id, appears in snapshots only while active
- Snapshot: tick, seed, active player states (position, velocity, status, distance, score, run_id)
- Track: deterministic pipes derived from seed + tick progression
- Input: flap intents applied at next server tick in arrival order

## Review & Acceptance Checklist

- Protocol updates extend shared schema (no forks)
- Server-authoritative model preserved
- Replay logging fields identified (room_id, run_id, session/player id, seed, tick, timestamps)
- Accessibility acceptance criteria: keyboard-only flap; score/distance labels available to screen readers; contrast ratio ≥ 4.5:1
