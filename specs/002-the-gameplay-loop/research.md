# Phase 0 Research: Gameplay Loop & Run Lifecycle

## Decisions Summary (TL;DR)

- PRNG: splitmix64 (BigInt) for deterministic track generation (simple, high-quality distribution); can swap to XorShift64\* later without schema change.
- Snapshot Evolution: Add `snapshot-v2` (additive) merging room_id + seq + protocol_version + active + top + pipes; keep legacy snapshot (backward compatible) until deprecation window.
- Seq Representation: Use string numeric pattern for future >2^53-1 safety; internal logic uses BigInt.
- Anti-Cheat: Sliding 1s window input rate (>8) + per-tick position delta (|dx| or |dy| >120) → violation; 3 consecutive → removal; bots exempt from removal.
- Track Seed: crypto.randomBytes(8) → BigInt; deterministic splitmix64 stepping; pure window generation function (seed, index) → window params.
- Scoring Weights: PIPE_WEIGHT=100, DISTANCE_WEIGHT=1 (tunable; stored shared immutable).
- Engraving: 120s window, length 1–24, deny-list + regex (no control chars, no >20 repeats), non-unique names.
- Metrics: Placeholders only now (tick drift, snapshot size, anti-cheat violations).
- Performance Target: Snapshot ≤2 KB p95; input→effect ≤150 ms p95; evaluator O(N) minimal allocations.
- Governance: All new schemas land under shared/schemas/protocol/v1 with registry & contract tests; additive only.

## Scope

Foundation for deterministic real-time gameplay loop: room assignment, bot spawning ratio, physics tick, anti-cheat thresholds, snapshot serialization, engraving flow.

## Decision Log

### 1. Simulation Tick & Timing

- Decision: Fixed 60 Hz server tick (16.666... ms) using setInterval / tight loop with drift correction.
- Rationale: Matches constitution, simplifies deterministic physics.
- Alternatives: Variable timestep (rejected: non-deterministic), client-driven updates (rejected: trust & divergence).

### 2. Physics Determinism

- Decision: Centralize constants (gravity, flap impulse, horizontal velocity) in shared module with immutable export; seeded RNG for procedural track.
- Rationale: Single source truth; reproducibility for replay/fairness.
- Alternatives: Duplicate constants on client (risk drift), runtime config fetch (adds latency).

### 3. Procedural Track Generation

- Decision: Per-room seed generated at room creation using crypto RNG; stored and reused for lifetime of room.
- Rationale: All participants see identical obstacle layout; allows late join consistency.
- Alternatives: Per-run seeds (would diverge states), global single seed (less variety across rooms).

### 4. Snapshot Ordering & Delivery

- Decision: Monotonic uint64 `seq` starting at 1, increment each tick; no timestamp required for ordering; clients discard <= last seq.
- Rationale: Minimal, sufficient for ordering & dedupe; reduces payload size.
- Alternatives: Include timestamp (not needed for ordering), hash chaining (added complexity, low value now).

### 5. Anti-Cheat Enforcement

- Decision: Remove player after 3 consecutive violating ticks (input rate or positional delta). Each tick records violation boolean; counter resets on clean tick.
- Rationale: Balances false positive resilience with fast cheat suppression; deterministic removal rule.
- Alternatives: Weighted scoring of violations (complex), rolling window counts (slower to act).

### 6. Bot Implementation

- Decision: Bots share physics code path; decision layer schedules flap inputs via heuristic (e.g., target gap center) before collision risk.
- Rationale: Ensures fairness & consistent difficulty baseline.
- Alternatives: Pre-scripted path (predictable and stale), random flaps (unrepresentative difficulty).

### 7. Scoring Composite Weights

- Decision: Store PIPE_WEIGHT and DISTANCE_WEIGHT in shared constants; initial default PIPE_WEIGHT=100, DISTANCE_WEIGHT=1 (tune later in balance pass task).
- Rationale: Emphasize pipe success while allowing distance role early.
- Alternatives: Equal weighting (reduces nuance), distance only (less skill gating), pipes only (ties frequent).

### 8. Engraving Model

- Decision: Non-unique names accepted; display uses `name#runId` disambiguation; max length 24 chars; allowed charset A-Z a-z 0-9 space - \_.
- Rationale: Reduces friction; uniqueness adds coordination overhead.
- Alternatives: Global uniqueness (name squatting risk), per-room uniqueness (unclear user benefit).

### 9. Engraving Filter

- Decision: Basic deny-list (profanity, slurs) + reject disallowed chars; future enhancement: regex severity scoring.
- Rationale: Lightweight initial safety, easy to extend.
- Alternatives: External moderation API (cost & latency), no filtering (risk).

### 10. Run Termination Causes

- Decision: Enum {collision, boundary, cheat-removal, disconnect, timeout, server-shutdown}. Timeout reserved for future (AFK or window expiry) but included now for forward compatibility.
- Rationale: Closed set simplifies analytics & tests.
- Alternatives: Free-form string (risk inconsistency), broader taxonomy now (overfitting).

### 11. Serialization Format

- Decision: JSON with concise field names; maintain schema version in shared but not in each message yet (phase 2); compress only if payload >4KB (not expected early).
- Rationale: Developer velocity > micro-optimizing prematurely.
- Alternatives: Binary (FlatBuffers/Protobuf) (premature complexity).

### 12. Input Handling

- Decision: Client sends discrete flap events with client frame timestamp; server does not trust timestamp for ordering, only for diagnostics.
- Rationale: Prevents client speed hacks; reduces state complexity.
- Alternatives: Continuous input polling (more bandwidth), trusting client timing (cheat vector).

### 13. Room Scaling Strategy

- Decision: Stateless logical rooms in single process initially; horizontal scale by process replication with sharding at matchmaker (future enhancement outside current feature scope).
- Rationale: Keeps complexity low for MVP.
- Alternatives: Distributed state (Redis pub/sub) now (premature).

### 14. Observability (Deferred Minimal Set)

- Decision: Phase 1 will not implement full metrics; add placeholders for: tick_duration_ms histogram, seq_gap counter, violation_rate, snapshot_size_bytes.
- Rationale: Avoid blocking core loop; metrics tasks later.

## Open Questions (Deferred)

- Final profanity list source and update cadence.
- Automated balancing process for weights after telemetry.
- Timeout cause trigger rules (currently unused) – define when implementing AFK detection.

## Risks & Mitigations

| Risk                                   | Impact                    | Mitigation                                                           |
| -------------------------------------- | ------------------------- | -------------------------------------------------------------------- |
| Tick drift under load                  | Desync / fairness issues  | Monitor tick_duration; shed load or reduce room count                |
| Large snapshots (bot count \* players) | Bandwidth & latency       | Cap bots at 3 per player (already), prune ended entities immediately |
| False positive anti-cheat              | User frustration          | Consecutive violation rule, tune thresholds in config                |
| Engraving abuse (edge cases)           | Offensive content         | Deny-list + reject unknown chars                                     |
| Seed predictability                    | Track reverse-engineering | Use crypto RNG + do not expose seed                                  |

## Research Completion Statement

All critical clarifications from spec integrated. Remaining open items explicitly deferred and non-blocking. Ready for Phase 1 design.
**_ End of research.md _**
