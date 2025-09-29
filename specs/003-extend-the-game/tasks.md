# Tasks: Join flow, idle spectate, color choice, and room leaderboard

Legend:
- [P] = Can be done in parallel with other [P] tasks once its direct prerequisites are done
- Unless noted, follow TDD: write/adjust tests first, then implement to green

Notes and constraints:
- Protocol v1 changes must be additive: do not remove or rename existing fields; prefer adding new fields or new events. Keep `snapshot.event` backward compatible (retain `players`) and add a new `participants` array for idle/spectate.
- Score is distance traveled; leaderboard tie-breaker is earlier end timestamp.
- Room capacity is 32; fill-first assignment; auto-create new rooms when full.

1. [X] Contracts: Update join.request to accept color [tests-first]
   - Files:
     - tests/contract/join.request.schema.test.ts
     - shared/schemas/protocol/v1/join.request.schema.json
   - Add payload property `color` with pattern `^#([0-9a-fA-F]{6})$` (still allow additionalProperties).
   - Test: valid color passes; invalid color (e.g., `#GG0000`, `#123`) fails; color is optional but validated when present.

2. [X] Contracts: Update join.ack to include color [tests-first]
   - Files:
     - tests/contract/join.ack.schema.test.ts
     - shared/schemas/protocol/v1/join.ack.schema.json
   - Add `color` (string, pattern `^#([0-9a-fA-F]{6})$`) to payload and include it in `required`.
   - Test: payload must include room_id, seed, color; invalid color rejected.

3. [X] Contracts: Extend snapshot.event additively with participants [tests-first]
   - Files:
     - tests/contract/snapshot.event.schema.test.ts
     - shared/schemas/protocol/v1/snapshot.event.schema.json
   - Add optional `participants` array under payload:
     - Each item: { player_id: string, status: 'idle'|'active', color: string (pattern), position?: {x,y}, velocity?: {x,y}, distance?: number }
     - Do NOT change existing `players` shape or requirements (backward compatibility).
   - Also add `color` to items of existing `players` entries (optional to keep compatibility); test both arrays.
   - Tests: schema accepts payloads with only `players` (old), with both arrays, and validates `participants` entries according to status.

4. [X] Contracts: New leaderboardUpdate.event [tests-first]
   - Files:
     - tests/contract/leaderboardUpdate.event.schema.test.ts (new)
     - shared/schemas/protocol/v1/leaderboardUpdate.event.schema.json (new)
   - Event payload: { room_id: string, entries: [{ player_id: string, color: string (pattern), score: number, ended_at: integer(ms) }] }
   - Tests: require top-level fields; validate color pattern; entries array can be empty; max 10 entries not enforced by schema (enforced in logic).

5. Shared types: Define Participant and LeaderboardEntry [P]
   - Files:
     - src/shared/types.ts
   - Add TypeScript interfaces/types for Participant and LeaderboardEntry matching the contracts; export for server/client use.

6. [X] Server: Room model supports idle/active participants [tests-first]
   - Files:
     - src/server/room.ts
     - tests/unit/room.participants.test.ts (new)
   - Add state to track players in room with `state: 'idle'|'active'`, player color, and mapping to runs.
   - Methods: addIdlePlayer(id,color), startRunOnFirstFlap(id), endRun(id, reason, ended_at), getParticipantsSnapshot().
   - Tests: adding idle marks status idle; first flap switches to active and creates run id; participants include idle+active correctly.

7. [X] Server: Leaderboard update logic and sorting [tests-first]
   - Files:
     - src/server/room.ts (extend)
     - tests/unit/leaderboard.sort.test.ts (new)
   - Implement in-memory leaderboard per room (top 10). Sort by score desc; tie-break earlier started_at.
   - Tests: sorting order with ties; trimming to 10 entries.

8. [X] Server: RoomManager capacity and assignment [tests-first]
   - Files:
     - src/server/roomManager.ts
     - tests/integration/room-capacity-assignment.test.ts (new)
   - Implement fill-first assignment with capacity 32; when full, create a new room and assign subsequent joins there.
   - Test: simulate 33 joins; first 32 share room A; 33rd in room B.

9. [X] Server: Validate and store color on join, send color back in join.ack
   - Files:
     - src/server/server.ts
     - src/server/roomManager.ts (if needed)
     - tests/integration/join-echoes-color.test.ts (new)
   - Parse `color` from join.request; validate format (reuse AJV or a simple regex in TypeScript in addition to schema-level test); store on player; include color in join.ack payload.

10. [X] Server: Broadcast snapshots with participants array (additive)
    - Files:
      - src/server/server.ts
      - src/server/room.ts
      - tests/integration/snapshot-includes-participants.test.ts (new)
    - Keep existing `players` array for back-compat; add `participants` populated with all players in room (idle+active) including color; for active, include position/velocity/distance; for idle, omit those fields.

11. [X] Server: Emit leaderboardUpdate.event on run end
    - Files:
      - src/server/server.ts
      - src/server/room.ts
      - shared/schemas/protocol/v1/leaderboardUpdate.event.schema.json (from Task 4)
      - tests/integration/leaderboard-update-on-runEnd.test.ts (new)
    - On run end, update room leaderboard; broadcast leaderboardUpdate.event with top 10.

12. [X] Server: Disconnect semantics aligned with spec
    - Files:
      - src/server/server.ts
      - src/server/room.ts
      - tests/integration/disconnect-idle-remove-active-end.test.ts (new)
  - If idle disconnects → remove participant; if active disconnects → end run and record score before removal; assert leaderboard updated accordingly.
  - Tests: `tests/integration/disconnect-idle-remove-active-end.test.ts` added and passing.

13. [X] Client: Join page color input and validation [P]
    - Files:
      - src/client/app/page.tsx (Join page)
      - src/client/lib/net.ts
      - src/client/components (create a small ColorInput if helpful)
      - tests (manual/QA acceptable here; automated E2E out of scope)
  - Added text input with `#RRGGBB` validation and a Random button; Start disabled until valid; color included in join.request via net.ts.

14. [X] Client: Handle participants in snapshots and render spectate state [P]
    - Files:
      - src/client/lib/net.ts
      - src/client/components/GameCanvas.tsx
      - src/client/app/page.tsx or app layout where state lives
  - Network layer parses `participants`; GameCanvas renders idle placeholder using chosen color until first flap; active players always visible.

15. [X] Client: Render inline leaderboard and handle leaderboardUpdate.event [P]
    - Files:
      - src/client/lib/net.ts
      - src/client/components (new Leaderboard.tsx)
      - src/client/app/page.tsx or Game page integration
  - Subscribes to leaderboardUpdate.event and renders a top-10 overlay with color swatches; overlay now always derives from live active participants (no dead records), enriched with players for score/color; server leaderboard remains authoritative history.

16. [X] Shared physics/score alignment (distance=score)
    - Files:
      - src/shared/physics.ts
      - tests/unit/score.test.ts (adjust/extend if necessary)
    - Ensure score reflects distance traveled; adjust existing tests only if inconsistent with clarified rule.

17. [X] Logging/replay: include new fields
    - Files:
      - src/shared/logging.ts (if applicable)
      - src/server/server.ts
    - Add color to join logs; log leaderboard updates with run_id/player_id/score to aid deterministic replay.

18. [X] Update agent instructions and docs [P]
    - Files:
      - .github/copilot-instructions.md
      - specs/003-extend-the-game/quickstart.md (ensure it matches actual flows)
    - Add this feature to Active Technologies/Recent Changes; verify quickstart steps are accurate.

19. [X] Post-Design Constitution Check [P]
    - Files:
      - specs/003-extend-the-game/plan.md (update Gate: Post-Design Constitution Check → PASS)
    - Confirm additive protocol updates, tests-first, and accessibility/security notes.

20. [X] Quality gates: full test suite PASS
    - Execute unit, contract, and integration tests; fix any regressions.
    - Ensure Typescript builds; no lint/type errors.

21. [X] Optional polish: rate limit unaffected [P]
    - Files:
      - tests/integration/rate-limit.test.ts
    - Quickly re-run to ensure no regressions from new message sizes or frequencies.

22. [X] Optional polish: multiplayer visibility property test [P]
    - Files:
      - tests/integration/multiplayer-visibility.test.ts
    - Extend/adjust to assert spectators always see active participants via `participants`.

---

Try order of execution:
- Start with Tasks 1–4 (contracts) → 5–8 (shared types/room/manager foundations) → 9–12 (server flows) → 13–15 (client) → 16–20 (alignment + validation). Items marked [P] can be parallelized where practical.
