# Data Model: Gameplay Loop & Run Lifecycle

Status: Draft (Phase 1)  
Source Spec: `specs/002-the-gameplay-loop/spec.md`  
Related Research: `research.md`

## Design Principles

- Deterministic server‑authoritative simulation (single source of truth for physics & RNG seed)
- Minimal state surface area in snapshots (only active entities + top ten)
- Separation of transient vs. finalized run data
- Explicit termination cause taxonomy (enum) for analytics & tests
- All IDs opaque (no guessable sequences exposed externally)

## Identifier Strategy

| Entity     | Field     | Type                          | Generation                | Notes                                       |
| ---------- | --------- | ----------------------------- | ------------------------- | ------------------------------------------- |
| Room       | room_id   | string (ULID)                 | On room create            | Sortable by time, uniqueness across process |
| Player     | player_id | string (ULID)                 | On connect                | Stable for session                          |
| Bot        | bot_id    | string (prefixed ULID `bot_`) | When spawned              | Deterministic? No (not required)            |
| Run        | run_id    | string (ULID)                 | On first flap (run start) | Immutable                                   |
| Snapshot   | seq       | uint64                        | Tick counter              | Per-room monotonic starting at 1            |
| Engraving  | (none)    | N/A                           | Uses run_id               | Engraving belongs to Run                    |
| Track Seed | seed      | uint64                        | On room create            | Stored; not exposed                         |

## Enumerations

```ts
export type RunTerminationCause =
  | "collision"
  | "boundary"
  | "cheat-removal"
  | "disconnect"
  | "timeout"
  | "server-shutdown";

export type PlayerState = "idle" | "active" | "ended";
```

## Entity Schemas (Conceptual)

Notation: TypeScript-like (non-runtime). Optional fields marked with `?`.

### Room

```ts
interface Room {
  room_id: string;
  seed: number; // Procedural track seed (uint64 range)
  created_at: number; // ms epoch
  humans: Set<string>; // player_id values (idle|active|ended participants)
  bots: Set<string>; // bot_id values
  track: TrackDefinition; // Generated from seed (immutable)
  seq: bigint; // Current snapshot sequence number
  scoreboard: ScoreEntry[]; // Top current scores (dynamic)
  runs: Map<string, Run>; // run_id → Run (active + ended)
  config: RoomConfig; // Limits (max players, bot ratio, etc.)
}
```

### RoomConfig

```ts
interface RoomConfig {
  max_humans: number; // 20
  bots_per_human: number; // 3
  tick_hz: number; // 60
  pipe_weight: number; // PIPE_WEIGHT constant
  distance_weight: number; // DISTANCE_WEIGHT constant
  engraving_window_ms: number; // 120_000
  anti_cheat: AntiCheatConfig;
}
```

### AntiCheatConfig

```ts
interface AntiCheatConfig {
  max_inputs_per_second: number; // Threshold (tuneable)
  max_position_delta: number; // Max allowed delta between ticks (physics bound)
  consecutive_violation_limit: number; // 3 (removal)
}
```

### Run

```ts
interface Run {
  run_id: string;
  player_id: string; // or bot_id for bots
  room_id: string;
  started_seq: bigint; // Sequence when run became active
  ended_seq?: bigint; // Sequence when run ended
  state: "active" | "ended";
  score: number; // Current composite score
  pipes_passed: number;
  distance: number; // Accumulated forward distance (pixels or world units)
  elapsed_ms: number; // Derived = (current_seq - started_seq) * tick_ms (on end)
  termination_cause?: RunTerminationCause; // Set on end
  engraving?: Engraving; // Present only after accepted
  engraving_deadline_ms: number; // epoch ms deadline for engraving
  is_bot: boolean;
}
```

### Engraving

```ts
interface Engraving {
  name: string; // Filtered, immutable once set
  submitted_at: number; // ms epoch
  accepted: true;
}
```

### Player (Session-Scoped)

```ts
interface Player {
  player_id: string;
  room_id: string;
  connection_id: string; // WS connection handle / reference
  state: PlayerState; // idle | active | ended (mirrors active run)
  active_run_id?: string; // Present if state active
  last_input_seq?: bigint; // Sequence of last processed flap
  violation_streak: number; // Consecutive violating ticks
  created_at: number;
  disconnected: boolean; // True after disconnect (run termination cause set)
  physics: PhysicsState; // Authoritative physics
}
```

### Bot

```ts
interface Bot {
  bot_id: string;
  room_id: string;
  controller: BotControllerState;
  active_run_id?: string; // Run representing bot attempt
  physics: PhysicsState;
  created_at: number;
}
```

### PhysicsState

```ts
interface PhysicsState {
  x: number; // Horizontal position
  y: number; // Vertical position
  vx: number; // Horizontal velocity (likely constant)
  vy: number; // Vertical velocity
}
```

### TrackDefinition & PipeWindow

```ts
interface TrackDefinition {
  seed: number;
  windows: PipeWindow[]; // Potentially infinite generated lazily; store recent + upcoming
}

interface PipeWindow {
  id: number; // Incremental within room
  x: number; // Horizontal position
  gap_y: number; // Center Y of gap
  gap_height: number; // Height of gap
}
```

### Snapshot (Wire Payload Subset)

```ts
interface SnapshotMessage {
  type: "snapshot";
  room_id: string;
  seq: string; // As string if using bigint JSON; strictly increasing
  active: ActiveEntityState[]; // Players + bots still running
  top: ScoreEntry[]; // Top ten (sorted desc by score, tie break elapsed_ms ascending)
  pipes: PipeWindow[]; // Current + near-future windows (limited slice)
}

interface ActiveEntityState {
  id: string; // player_id or bot_id
  is_bot: boolean;
  x: number;
  y: number;
  vy: number;
  score: number;
  pipes_passed: number;
}
```

### ScoreEntry

```ts
interface ScoreEntry {
  run_id: string;
  name?: string; // Engraving name if present
  score: number;
  distance: number;
  pipes_passed: number;
  elapsed_ms: number;
}
```

### RunEnd Message

```ts
interface RunEndMessage {
  type: "runEnd";
  room_id: string;
  run_id: string;
  player_id: string; // or bot_id
  is_bot: boolean;
  score: number;
  distance: number;
  pipes_passed: number;
  elapsed_ms: number;
  cause: RunTerminationCause;
  engraving?: { name: string };
}
```

### Engraving Request / Ack

```ts
interface EngravingRequestMessage {
  type: "engrave";
  run_id: string;
  name: string;
}

interface EngravingAckMessage {
  type: "engraveAck";
  run_id: string;
  accepted: boolean;
  reason?: "timeout" | "filtered" | "window-expired";
  name?: string; // Present if accepted
}
```

### Join / Ack

```ts
interface JoinRoomMessage {
  type: "join";
}

interface JoinAckMessage {
  type: "joinAck";
  room_id: string;
  seed_hash: string; // (optional) hashed seed if ever exposed (may omit entirely initially)
  max_humans: number;
  bots_per_human: number;
  tick_hz: number;
}
```

### Tick Input (Flap)

```ts
interface TickInputMessage {
  type: "flap";
  client_time?: number; // diagnostic only
}
```

## State Transitions

### Player / Run

```
IDLE --(flap)--> ACTIVE --(collision|boundary|cheat-removal|disconnect|timeout|server-shutdown)--> ENDED
```

- Transition guard: flap ignored if already ACTIVE or ENDED.
- On END: active_run_id cleared; Run finalized; Player.state = 'ended'.

### Violation Escalation

```
violation_streak = 0
for each tick:
  if violation -> streak++ else streak=0
  if streak == 3 -> remove player (cause=cheat-removal)
```

## Validation Rules

- Engraving name length: 1..24 chars
- Charset: `[A-Za-z0-9 _-]+`
- Filtering: deny-list substring match (case-insensitive)
- Max inputs: anti_cheat.max_inputs_per_second; measured over sliding 1s window or per-tick counter \* tick_hz
- Max position delta: anti_cheat.max_position_delta; computed from physics constraints
- Snapshot seq: must increment by exactly 1; if gap detected → internal metric increment
- Scoreboard ordering: sort desc(score), then asc(elapsed_ms), then asc(run_id) for deterministic tie-break.
- Anti-cheat consecutive violation removal threshold: anti_cheat.consecutive_violation_limit (3) not configurable per room (global constant exported) for fairness.

## Derived Fields

- Run.score computed each tick from pipes_passed & distance
- Run.elapsed_ms computed only on end (avoid drift by multiplying tick count \* tick_ms)

## Persistence Strategy (MVP)

- All entities in memory only
- Potential future persistent objects: finalized Run summary, Engraving index

## Open / Deferred

- Timeout cause trigger definition (AFK rules) not implemented yet
- Seed hashing/exposure strategy (security tradeoff) deferred
- Bot controller heuristics specifics (scoring lookahead) omitted (implementation detail)
- Snapshot-v2 introduction: data model reflects union of legacy and new fields; legacy snapshot remains until deprecation cycle defined in governance.

## Ready for Contracts

This data model provides stable naming & structure sufficient to generate/validate Phase 1 protocol schemas.
