# Feature Specification: Real-time Multiplayer WebSocket Protocol

**Feature Branch**: `001-a-real-time`  
**Created**: 2025-09-23  
**Status**: Draft  
**Input**: User description: "A real-time multiplayer networking contract over WebSockets that defines all message types between client and server; clients may only transmit input messages {type:\"input\", seq, action:\"flap\"|\"start\"|\"join\", ts} and engraving messages {type:\"engrave\", run_id, name}; the server must broadcast authoritative state using three message types: snapshot containing {server_tick, players:[{id, x, y, vx, vy, state}], pipes_window, leaderboard_topN}, runStart containing {run_id, room_id, player_id, start_time}, and runEnd containing {run_id, end_time, score, cause}; all messages must include a protocol_version field and follow JSON schemas versioned in shared/; invalid or malformed messages must be rejected with an error type message; clients must attach monotonically increasing sequence numbers so the server can deduplicate and order inputs; server broadcasts must be ordered by server_tick and ignored if stale; the protocol must be idempotent and safe to replay from logs; all schema changes must increment protocol version per SemVer rules; this specification covers validation, ordering, error handling, and backward compatibility guarantees."

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## Clarifications

### Session 2025-09-23
- Q: What is the canonical timestamp format for all messages (ts, start_time, end_time)? → A: Unix epoch milliseconds (number, UTC)
- Q: What is the exact schema for pipes_window in snapshots? → A: Compact arrays: {x:[], gapY:[], gapH:[], id:[]} (aligned by index)
- Q: What are the allowed values for PlayerState.state? → A: idle, alive, dead
- Q: What is the exact shape for leaderboard_topN entries in snapshots? → A: `{player_id, name, score, rank, at}` where `at` is the snapshot's `server_tick` (number)
- Q: How is protocol version negotiation performed? → A: Client sends "hello" with protocol_version; server replies "welcome" or `error`

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a player in a real-time multiplayer Flappy game, my client sends only allowed input or engraving messages, and the server broadcasts authoritative game state and run lifecycle messages so that my view stays consistent, fair, and in sync with all other players.

### Acceptance Scenarios
1. Given a connected client with protocol_version matching the server MAJOR,
   When the client sends `{type:"input", seq:42, action:"flap", ts: <epoch_ms>}`,
   Then the server accepts and sequences the input, and the next `snapshot` reflects the effect.

2. Given a client that resends `{type:"input", seq:42, action:"flap", ...}` (duplicate),
   When the server receives it again,
   Then the server deduplicates by `seq` for that player and ignores the duplicate without side effects.

3. Given the client has processed a `snapshot` with `server_tick = T`,
   When it receives a `snapshot` with `server_tick < T`,
   Then the client ignores the stale message.

4. Given a client sends a malformed message (missing required fields),
   When the server validates the message,
   Then the server rejects it and responds with `{type:"error", code, message, details}`.

5. Given a minor protocol version difference within the same MAJOR (server supports superset),
   When the client sends allowed messages for its MINOR version,
   Then the interaction succeeds; unknown fields are ignored; no breaking behavior occurs.

6. Given a major protocol mismatch (different MAJOR),
   When the client sends any message,
   Then the server responds with an `error` indicating incompatible protocol and includes an `upgrade_hint`.

9. Given a new WebSocket connection,
   When the client sends `{type:"hello", protocol_version, client_info?}` as the first message,
   Then the server responds with `{type:"welcome", protocol_version, server_info?}` if compatible, otherwise `error` and the connection may be closed.

7. Given the server emits `runStart` at the beginning of a session,
   When clients receive it,
   Then they initialize local state for `run_id`, `room_id`, and `player_id` and begin applying snapshots.

8. Given a run concludes,
   When the server emits `runEnd` with `{run_id, end_time, score, cause}`,
   Then clients finalize local state and update leaderboard based on subsequent `snapshot` data.

### Edge Cases
- Clock skew: If `ts` is significantly skewed, the server still sequences by server time; `ts` is advisory and used for diagnostics.
- High latency or packet loss: Gaps in `seq` are tolerated; out-of-order inputs are reordered server-side; excessive gaps may trigger rate-limit or error.
- Replay: Replaying the full message log (inputs and broadcasts) deterministically reconstructs the same state.
- Name engraving: Profanity or length limits are enforced; invalid `engrave` is rejected with `error`.
- Leaderboard window size: If `leaderboard_topN` is empty or smaller than N, clients render available entries without error.

## Requirements *(mandatory)*

### Functional Requirements
- FR-001: Clients MUST only send two message types: `input` and `engrave`.
- FR-002: `input` message MUST include `protocol_version`, `type:"input"`, `seq` (monotonically increasing per client session), `action` ∈ {`flap`,`start`,`join`}, and `ts` (client timestamp).
- FR-003: `engrave` message MUST include `protocol_version`, `type:"engrave"`, `run_id`, and `name` (subject to validation rules).
- FR-004: The server MUST broadcast only three authoritative message types: `snapshot`, `runStart`, and `runEnd`.
- FR-005: `snapshot` MUST include `protocol_version`, `server_tick`, `players:[{id,x,y,vx,vy,state}]`, `pipes_window`, and `leaderboard_topN`. `pipes_window` MUST use compact arrays: `{x:number[], gapY:number[], gapH:number[], id:string[]}` aligned by index. `leaderboard_topN` entries MUST be `{player_id:string, name:string, score:number, rank:number, at:number}` with `at` equal to the snapshot's `server_tick`.
- FR-006: `runStart` MUST include `protocol_version`, `run_id`, `room_id`, `player_id`, `start_time`.
- FR-007: `runEnd` MUST include `protocol_version`, `run_id`, `end_time`, `score`, `cause`.
- FR-008: All messages MUST conform to JSON Schemas versioned in `shared/` and validated on send/receive by respective sides.
- FR-009: The server MUST reject invalid or malformed client messages and respond with an `error` message that includes `code`, `message`, and `details` (if applicable and safe to share). The `code` field MUST be one of the following enumerated values:
   - `validation_error`: The message failed schema validation (e.g., missing required fields, invalid types).
   - `rate_limit_exceeded`: The client exceeded the allowed input rate (e.g., more than 10 inputs/second).
   - `incompatible_protocol`: The client's protocol version is not supported by the server (upgrade hint).
   - `unauthorized`: The client attempted an action it is not permitted to perform.
   - `internal_error`: An unexpected server-side error occurred.
   - `bad_request`: The message is syntactically invalid or violates protocol rules.
   - `resource_exhausted`: The server cannot process the request due to resource constraints (e.g., memory, connections).
   - `not_found`: The requested resource or entity does not exist.
   - `conflict`: The request conflicts with the current state of the server (e.g., duplicate engraving name).
   - `unsupported_action`: The client attempted an action not supported in the current context.
- FR-010: Clients MUST attach monotonically increasing `seq` numbers to inputs so the server can deduplicate and order them.
- FR-011: The server MUST deduplicate inputs by `(player_id, seq)` and ensure idempotent processing.
- FR-012: Server broadcasts MUST be strictly ordered by `server_tick`; clients MUST ignore any broadcast older than the last processed tick.
- FR-013: The protocol MUST be idempotent and safe to replay from logs to reconstruct the same authoritative state.
- FR-014: All schema changes MUST increment `protocol_version` following SemVer rules (MAJOR breaking, MINOR additive, PATCH clarifications).
- FR-015: Within the same MAJOR, clients and server MUST interoperate; unknown fields MUST be ignored; unknown required fields MUST cause validation failure.
- FR-016: Error handling MUST avoid leaking sensitive information; `details` MUST contain only validation context (e.g., field names, expected types).
- FR-017: Rate limiting and abuse controls MUST be applied to client inputs to ensure fairness and stability. Max 10 inputs/second.
- FR-018: Timestamps (`ts`, `start_time`, `end_time`) MUST be Unix epoch milliseconds (number, UTC).
- FR-020: `cause` in `runEnd` MUST be an enumerated set (e.g., `collision`, `timeout`, `disconnect`, `server_shutdown`).
- FR-021: Names in `engrave` MUST meet policy (length ≤ 24, allowed characters a-Z, A-Z, 0-9, emojis, unicode).
- FR-022: Version negotiation MUST use an explicit handshake: the client first sends `{type:"hello", protocol_version, client_info?}`; the server responds with `{type:"welcome", protocol_version, server_info?}` if compatible, otherwise `{type:"error", code:"incompatible_protocol", upgrade_hint}`. No other messages are accepted before `welcome` is sent.
- FR-023: Within the same MAJOR version, clients MUST discover server capabilities by sending `{type:"capabilities_request", protocol_version}`. The server MUST respond with `{type:"capabilities_response", protocol_version, supported_features:[string]}` listing all supported features. Unsupported requests MUST result in an `error` with `code:"unsupported_action"`.
- FR-024: On minor version differences, the server MUST accept messages defined by the client's version and omit features unknown to the client.
- FR-025: Clients MUST persist last processed `server_tick` locally during a session and discard stale messages accordingly.
- FR-026: `welcome` is a control message and is not part of the authoritative broadcast set (which remains limited to `snapshot`, `runStart`, `runEnd`).

### Key Entities *(include if feature involves data)*
- Message: Common envelope with `protocol_version` and `type`.
- Input: `{type:"input", protocol_version, seq:number, action:"flap"|"start"|"join", ts:number}`.
- Engrave: `{type:"engrave", protocol_version, run_id:string, name:string}`.
- Snapshot: `{type:"snapshot", protocol_version, server_tick:number, players:[PlayerState], pipes_window: PipesWindow, leaderboard_topN:[LeaderboardEntry]}`.
- RunStart: `{type:"runStart", protocol_version, run_id:string, room_id:string, player_id:string, start_time:number}`.
- RunEnd: `{type:"runEnd", protocol_version, run_id:string, end_time:number, score:number, cause:string}`.
- Error: `{type:"error", protocol_version, code:string, message:string, details?:object, upgrade_hint?:string}`.
- Hello: `{type:"hello", protocol_version:string, client_info?:{client?:string, version?:string}}`.
- Welcome: `{type:"welcome", protocol_version:string, server_info?:{version?:string}}`.
- PlayerState: `{id:string, x:number, y:number, vx:number, vy:number, state:"idle"|"alive"|"dead"}`.
- PipesWindow: `{x:number[], gapY:number[], gapH:number[], id:string[]}` — arrays are the same length and aligned by index; each index represents one pipe's x position, gap vertical center (gapY), gap height (gapH), and identifier (id).
- LeaderboardEntry: `{player_id:string, name:string, score:number, rank:number, at:number}` — `at` equals the snapshot's `server_tick`. Tie-breaking is based on `score` (higher is better), and in case of equal scores, `rank` is determined by the lexicographical order of `player_id`.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
