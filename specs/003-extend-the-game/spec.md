# Feature Specification: Join flow, idle spectate, color choice, and room leaderboard

**Feature Branch**: `003-extend-the-game`  
**Created**: 2025-09-28  
**Status**: Draft  
**Input**: User description: "Extend the game loop with join flow, idle spectate, color choice, and room leaderboard. When a player connects they choose an RGB hex color and are assigned to a room. Before starting a run, they idle in spectate mode and receive snapshots of other active players. Idle players always see current runs. When runs end, results update a room leaderboard that displays the top 10 for that room. Acceptance: fake client can choose a color, join a room, see others running while idle, start its own run, collide, and see the room leaderboard updated. Barebones client renders idle spectate state and inline room leaderboard in Canvas. Idle spectate implemented. double check."

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

Constitution alignment (v1.0.0):

- Protocol updates MUST extend `shared/schemas/protocol/v1` rather than fork it
- Server remains authoritative; client changes are rendering/UI only
- New interactions MUST state replay logging fields (ids, timestamps, seeds)
- Accessibility acceptance criteria (keyboard, labels, contrast) included
- Security notes for production paths (TLS/WSS, input validation)

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

   ### Session 2025-09-28

   - Q: Which tie-break rule should the room leaderboard use when two runs have the same score? → A: Earlier end timestamp ranks higher.
   - Q: Should colors be unique per room, or can multiple players in the same room share the same color? → A: Duplicates allowed within a room.
   - Q: How should rooms be assigned and capped? → A: Fill-first per room, cap 32, auto-create new room when full.
   - Q: Leaderboard retention: should the room leaderboard persist across server restarts? → A: In-memory only; resets on restart.
   - Q: Scoring metric for leaderboard ordering: confirm what “score” represents. → A: Distance traveled.
   - Q: Disconnect semantics: how should we handle player disconnects? → A: Idle disconnect: remove; In-run: end run and record.
   - Q: Snapshot contents — should snapshots include both idle and active participants, with a status field? → A: Include idle and active with status field.

   ---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

As a new player connecting to the game, I choose a personal color, get placed into a room, watch other players currently running while I am idle (spectating), and when I start my own run and eventually collide, I see my result reflected in the room’s top-10 leaderboard.

### Acceptance Scenarios

1. Given a new connection, when the player chooses a valid RGB hex color and joins a room, then the player enters idle spectate state in that room.
2. Given the player is idle in a room with active runs, when snapshots are delivered, then the player can see other active players’ current positions/states while spectating.
3. Given the player is idle, when the player initiates starting a run, then the player exits idle and their run becomes visible to others in the same room.
4. Given the player is in a run, when they collide/end their run, then the run result is recorded and the room leaderboard updates accordingly.
5. Given the room leaderboard exists, when it is displayed, then it shows the top 10 runs for that room in descending order by score with a deterministic tie-breaker.
6. Given the barebones client UI, when the player is idle, then the Canvas shows an idle spectate state and an inline room leaderboard.
7. Given the fake client, when it chooses a color, joins, idles and sees others running, starts a run, collides, then it observes the room leaderboard updated to include its result (if it qualifies for top 10).

### Edge Cases

- Invalid color format submitted (e.g., not in #RRGGBB). → Must be rejected with a clear error; player remains unjoined until a valid color is provided.
- Color uniqueness: duplicates allowed within a room.
- Room assignment & capacity: fill-first per room with capacity 32; when current room is full, a new room is auto-created and the player joins it.
- No active runs in room while idle. → Spectate should show an empty/quiet state; player remains idle until a run starts (by someone else or themselves).
- Leaderboard ties: earlier end timestamp ranks higher.
- Leaderboard retention: in-memory only; resets on server restart.
- Disconnects: idle → remove immediately; in-run → end run and record the score; spectators should no longer see the disconnected player.
- Replay determinism. → All events and ordering must be reproducible from logs; snapshot cadence and ordering must be deterministic within tolerances.

## Requirements _(mandatory)_

### Functional Requirements

- FR-001: On connection, the system MUST allow the player to choose a personal color in RGB hex format (e.g., #RRGGBB; case-insensitive).
- FR-002: The system MUST validate the chosen color format and reject invalid inputs with a clear message; the player is not joined until valid.
- FR-003: Upon successful color selection, the system MUST assign the player to a game room and provide the room identifier. [NEEDS CLARIFICATION: room selection strategy and capacity limits]
- FR-003: Upon successful color selection, the system MUST assign the player to a game room using a fill-first strategy with capacity 32 per room; when the current room is full, the server auto-creates a new room and assigns the player; the room identifier MUST be provided to the client.
- FR-004: Before beginning a run, the player MUST be placed in an idle spectate state inside their room and MUST NOT affect the game world.
- FR-005: While idle, the player MUST receive periodic snapshots for their room that include both idle and active participants; each participant entry MUST include status ("idle" | "active") and fields sufficient to render positions, movement (for active), and visual identity (e.g., color and a minimal display token).
- FR-006: Idle players MUST always see current runs; when a run starts or ends in their room, snapshots MUST reflect the change within the standard snapshot interval.
- FR-007: The player MUST be able to start their own run from idle via an explicit start action; upon start, they become visible to other players’ spectate views in the room.
- FR-008: When a player’s run ends (e.g., due to collision), the system MUST compute a run result (score) defined as distance traveled; the run is marked ended.
- FR-009: After a run ends, the system MUST update the room’s leaderboard and include the new result if it qualifies among the top 10.
- FR-010: The room leaderboard MUST display the top 10 results ordered by score descending; ties MUST rank by earlier end timestamp (earlier is higher).
- FR-011: The barebones client MUST render the idle spectate state and display the inline room leaderboard within the Canvas while idle.
- FR-012: Acceptance verification MUST include a fake client flow: choose color → join room → receive snapshots while idle → start run → collide → observe updated room leaderboard.
- FR-013: The feature MUST maintain visibility boundaries per room (spectators only see runs from their own room).
- FR-014: The system SHOULD provide minimal player identity suitable for leaderboard entries (e.g., color and a non-PII player token). [NEEDS CLARIFICATION: any additional display fields]
- FR-015: Color uniqueness is NOT enforced; multiple players in the same room may share the same RGB color.
- FR-016: Leaderboards are in-memory only and reset on server restart; no durable persistence is required.
- FR-017: Disconnect semantics — If a player disconnects while idle, they are removed from the room immediately. If a player disconnects during a run, the run ends and the current score is recorded (eligible for leaderboard updates).
- FR-018: Snapshot visibility — Spectators MUST always see all current active runs in their room in snapshots within the standard snapshot interval.

Constitutional requirements (add where applicable):

- **FR-00X**: Messages MUST conform to `shared/schemas/protocol/v1` and be additive
- **FR-00Y**: All interactions MUST be logged for deterministic replay
- **FR-00Z**: Client MUST reconcile to server-authoritative state

_Example of marking unclear requirements:_

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities _(include if feature involves data)_

- Player: A participant identified by a server-issued id and a chosen color (color is cosmetic and not unique within a room); has a state (idle spectating or in-run) and belongs to a room.
- Room: A logical grouping of players with shared visibility and a room-specific leaderboard; contains active runs and idle spectators.
- Room: A logical grouping of players with shared visibility and a room-specific leaderboard; contains active runs and idle spectators; has a capacity of 32 players; new rooms are auto-created when needed.
- Run: A single attempt by a player, with a start time, end condition (e.g., collision), and a computed score (distance traveled) used for leaderboard ranking.
- Snapshot: A periodic representation of participants in a room, including both idle and active players. Each participant entry includes status ("idle" | "active"), visual identity (e.g., color and display token), and, for active runs, current renderable state (e.g., position, velocity) needed for spectate.
- LeaderboardEntry: A record attached to a room comprising at least a score, time achieved, and a display identity (e.g., player color and token); used to present top 10.

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed
- [ ] Protocol updates extend shared schema (no forks)
- [ ] Server-authoritative model preserved
- [ ] Replay logging fields identified
- [ ] Accessibility acceptance criteria present
- [ ] Production security considerations (TLS/WSS, validation)

### Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
