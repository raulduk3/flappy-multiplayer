# Feature Specification: Gameplay Loop & Run Lifecycle

**Feature Branch**: `002-the-gameplay-loop`  
**Created**: 2025-09-23  
**Status**: Draft  
**Input**: User description: "The gameplay loop for runs in each room: when a user presses start on the Join page, the server assigns them to a room with a maximum of 20 players and spawns three bots per player; each run is identified by a unique immutable run_id issued by the server; the track is procedurally generated per room and identical for all participants; players begin idle in spectating state until they flap, at which point their run starts; the server advances simulation at 60 Hz applying gravity, forward velocity, and flap impulses; bots execute the same physics and logic as human players; collisions with pipes or screen edges immediately end a run, removing the bird from others’ views; the server emits snapshots each tick with all active states, top ten scores in-room, and pipe windows; when a run ends, the server finalizes {run_id, score, distance, elapsed_ms, cause} and broadcasts a runEnd event; players may engrave a unique name for their run within 120 seconds, filtered and immutable; after engraving they may return to the Join page or view the Global Leaderboard; fairness is enforced by anti-cheat checks validating input rates and positional deltas each tick, with escalating flags and removal on repeated violations."

## Clarifications

### Session 2025-09-23

- Q: What is the primary scoring formula for a run (value shown in the in-room top ten list)? → A: Composite weighted score (pipes _ weight + distance _ weight)
- Q: How should anti-cheat escalation work before a player is removed? → A: 3 consecutive violating ticks → removal
- Q: Which ordering/time metadata must each snapshot include? → A: Monotonic incrementing sequence number only
- Q: What should be the canonical set of termination causes? → A: collision, boundary, cheat-removal, disconnect, timeout, server-shutdown
- Q: What is the uniqueness scope for engraving names? → A: Not unique; name disambiguated by run_id

Applied clarifications:

- Scoring: Composite score formula defined (see FR-011).
- Anti-cheat: Removal after 3 back-to-back violating ticks; single anomalies reset the consecutive counter.
- Snapshot ordering: Single strictly increasing per-room sequence number `seq` (uint64 starting at 1) governs ordering; clients drop any snapshot with `seq <= lastAppliedSeq`.

## Execution Flow (main)

```
1. Parse user description from Input
2. Extract key concepts: rooms, players, bots, procedural track, physics tick (60Hz), lifecycle (idle→active→ended), snapshots, scoring, engraving, anti-cheat
3. Ambiguities marked where scope unclear
4. User scenarios defined (join, run, end, engraving, anti-cheat removal)
5. Functional Requirements enumerated (testable, numbered)
6. Key Entities identified: Room, Run, PlayerState, Bot, Track Segment / Pipe Window, Snapshot, Engraving, AntiCheatFlag
7. Review checklist pending clarifications
8. Output: Draft spec
```

---

## ⚡ Quick Guidelines

- ✅ Focused on user-visible gameplay loop and fairness expectations
- ❌ No implementation specifics (network libraries, DB schemas, code modules) included
- 👥 Audience: product + game design stakeholders

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

As a player, I want to join a multiplayer session and attempt a skill-based run on a shared, fair, procedurally generated track so I can compare my performance with others in real time and optionally engrave a commemorative name if I achieve a notable result.

### Acceptance Scenarios

1. Given the Join page is displayed and capacity exists, When the player presses Start, Then they are placed into a room that does not exceed 20 human players and see themselves in spectating (idle) state until first input.
2. Given a player is spectating in a room, When they press a flap input, Then their run begins (active state) and they move under physics while others continue unaffected.
3. Given a player or bot collides with a pipe or boundary, When collision occurs, Then that run ends immediately and the entity is removed from subsequent snapshots.
4. Given the simulation is running, When a tick elapses (1/60th second), Then a snapshot is emitted containing all active player/bot states, current top ten in-room scores, and current pipe windows.
5. Given a run has ended, When finalization occurs, Then a runEnd event is broadcast including run_id, score, distance, elapsed_ms, and cause of termination.
6. Given a runEnd event for a player-owned run has been broadcast, When the player opens the engraving option within 120 seconds, Then they may submit a unique filtered name which becomes immutable once accepted.
7. Given a player has engraved a name or the 120 second window expires, When they choose navigation, Then they can return to Join or view the Global Leaderboard.
8. Given a player exceeds permitted input rate or positional delta thresholds repeatedly, When anti-cheat escalation triggers, Then the player is flagged and ultimately removed from the room with their current run terminated.

### Edge Cases

- Room at capacity (20 players) when a new player attempts to join → player must be placed in a different room or prevented with clear feedback. New room auto spawns.
- Multiple players starting runs simultaneously on same tick → all should initialize consistently with identical track state.
- Engraving submission after 120s → must be rejected with clear feedback.
- Duplicate engraving name attempt → allowed; display may show name plus run identifier for disambiguation.
- Anti-cheat consecutive violation window: Player is only removed after 3 back-to-back violating ticks; transient single-tick anomalies (e.g., jitter) do not remove the player.
- Snapshot delivery delay/out-of-order/duplicate → consumers rely exclusively on monotonically increasing `seq`; any snapshot with `seq <= lastAppliedSeq` is dropped; gaps (seq > lastAppliedSeq + 1) are logged for diagnostics but later snapshots still applied strictly in order.
- Player begins flap exactly at same tick their room assignment finalizes → must start cleanly (no missed first input).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST assign a joining player to a room containing at most 20 human players.
- **FR-002**: System MUST spawn exactly three bot participants per human player in that room upon player join (or maintain that ratio). Bots only spawn when players join, and despawn when they die.
- **FR-003**: System MUST generate one procedural track per room that is identical for all participants for the duration of occupancy.
- **FR-004**: System MUST place newly joined players in an idle spectating state until their first flap input.
- **FR-005**: System MUST transition a player from idle to active run state upon first flap input.
- **FR-006**: System MUST simulate physics at 60 Hz applying gravity, forward velocity, and flap impulse uniformly to all active players and bots.
- **FR-007**: System MUST apply identical physics and logic rules to bots and human players.
- **FR-008**: System MUST immediately terminate a run upon collision with any pipe obstacle or screen boundary.
- **FR-009**: System MUST exclude ended runs from subsequent state snapshots.
- **FR-010**: System MUST emit a snapshot every simulation tick containing: (a) all active player and bot states, (b) top ten scores in the room, (c) current and near-future pipe windows.
- **FR-011**: System MUST compute a composite score each tick as: `score = (pipes_passed * PIPE_WEIGHT) + (distance_travelled * DISTANCE_WEIGHT)` where both weights are fixed, positive, and globally consistent for all rooms; ties are broken by lower elapsed_ms. (Removes prior ambiguity.)
- **FR-012**: System MUST finalize and broadcast a runEnd event with run_id, score, distance, elapsed_ms, and termination cause when a run ends.
- **FR-013**: System MUST provide players up to 120 seconds after runEnd to submit an engraving name for that run.
- **FR-014**: System MUST filter engraving names for prohibited content. Generate a starter list.
- **FR-015**: System MUST accept engraving names without enforcing global or scoped uniqueness; disambiguation for display/logging achieved by pairing name with run_id (e.g., `name#runId`).
- **FR-016**: System MUST make an accepted engraving immutable.
- **FR-017**: System MUST allow a player after engraving (or timeout) to navigate either back to Join page or to a Global Leaderboard view.
- **FR-018**: System MUST issue unique immutable run_id values for each run at start of run or earlier assignment.
- **FR-019**: System MUST perform anti-cheat validation each tick on input rate and positional deltas for each active player.
  - Thresholds (testable constants): `max_inputs_per_second = 8`, `max_position_delta_px = 120` (vertical or horizontal absolute delta between ticks). Measurement: inputs counted over a sliding 1 second window; position delta computed from authoritative physics state pre/post integration. These values MAY be tuned in a balance pass (MINOR protocol bump if surface exposed) but MUST have contract tests asserting presence and positivity.
- **FR-020**: System MUST remove (kick) a player after 3 consecutive simulation ticks each containing at least one qualifying anti-cheat violation (input rate or positional delta rule breach); a non-violating tick resets the consecutive counter.
- **FR-021**: System MUST terminate the player's current run at the moment of removal defined in FR-020 and broadcast its runEnd with cause=cheat-removal.
- **FR-022**: System MUST ensure that bots cannot trigger anti-cheat removal.
- **FR-023**: System MUST prevent gameplay advantage via divergent track generation (all participants share identical obstacle configuration). Test: deterministic seed usage. Seeds are hidden.
- **FR-024**: System MUST prevent a player from starting a second concurrent run while one is active.
- **FR-025**: System MUST provide feedback when an engraving attempt fails (timeout, duplicate, filtered).
- **FR-026**: System MUST remove ended birds from other players' visual context in the next tick snapshot.
- **FR-027**: System MUST include a strictly increasing per-room unsigned 64-bit sequence number `seq` in every snapshot starting at 1 and incrementing by exactly 1 each tick; clients MUST apply only snapshots with `seq == lastAppliedSeq + 1` and drop any with `seq <= lastAppliedSeq`.
- **FR-028**: System MUST classify every run termination with exactly one cause. The valid termination causes are: collision, boundary, cheat-removal, disconnect, timeout, and server-shutdown. A player disconnecting mid-run MUST result in cause=disconnect.
- **FR-029**: System MUST limit join attempts if no room capacity is available. Spawn a new room.
- **FR-030**: System MUST ensure fairness by applying identical flap impulse magnitude across all entities.

### Non-Functional Requirements

- **NFR-001 (Protocol Versioning)**: Every outbound WebSocket message (snapshot, runEnd, joinAck, engraveAck, etc.) MUST include a top-level `protocol_version` field matching SemVer (`MAJOR.MINOR.PATCH`) and equal to the version represented in shared protocol schemas. Changes follow SemVer: additive = MINOR, breaking = MAJOR. (Covered by task T051.)
- **NFR-002 (Anti-Cheat Threshold Visibility)**: The constants `max_inputs_per_second` and `max_position_delta_px` MUST be centrally exported in shared config and referenced by both server logic and tests to avoid drift.
- **NFR-003 (Deterministic Track Generation)**: Given a fixed seed, track window generation MUST be deterministic; identical sequences of windows (up to any requested length L) MUST be produced across processes.

### Track Seeding

Algorithm & Determinism Requirements:

1. On room creation, generate a 64-bit unsigned seed via cryptographically secure RNG (`crypto.randomBytes(8)` → BigInt) and store it immutably on the Room.
2. Track generation uses a deterministic pseudo‑random number generator (PRNG) (e.g., XorShift64\* or splitmix64) initialized with the seed to produce pipe window parameters.
3. Window generation function MUST be pure: given `(seed, window_index)` it yields identical `(x, gap_y, gap_height)` across executions.
4. Seeds are NOT exposed directly to clients; optionally a hash may be sent (future scope).
5. Test Strategy (T063): Generate first N (e.g., 50) windows twice with the same seed and assert deep equality; generate with a different seed and assert inequality in at least one window parameter.

Rationale: Ensures fairness (identical obstacles for all room participants) and reproducibility for debugging/replay while keeping track layouts unpredictable to clients.

### Key Entities

- **Room**: Logical container for up to 20 human players and their associated bots; owns procedural track definition, snapshot emission cadence, scoreboard.
- **Player**: Human participant with state (idle|active|ended), physics attributes (position, velocity), inputs, current run_id (if active), engraving window timer.
- **Bot**: Simulated participant mirroring Player physics model and scoring rules; may exist at a fixed ratio relative to human players.
- **Run**: Single attempt identified by immutable run_id with lifecycle (initialized, active, ended) and final metrics (score, distance, elapsed_ms, cause, engraving name?).
- **Track / Pipe Window**: Procedurally generated obstacle sequence shared across room; defines spatial configuration used for collision checks.
- **Snapshot**: Per-tick published aggregate containing active entity states, top ten scoreboard entries, current/future pipe windows, and ordering metadata (`seq` monotonically increasing only; no timestamp required for ordering).
- **Engraving**: Optional post-run commemorative name submission constrained by time window and uniqueness/filter rules.
- **AntiCheatFlag / Violation**: Record of per-tick validation outcomes with escalation level leading to removal.

---

## Review & Acceptance Checklist

_GATE: Pending clarifications before full acceptance_

### Content Quality

- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status

_Draft creation pass_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed (pending clarifications)
