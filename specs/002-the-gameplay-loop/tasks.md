# Tasks: Gameplay Loop & Run Lifecycle (Feature 002)

Status: Planned  
Branch: `002-the-gameplay-loop`  
Source Docs: `spec.md`, `research.md`, `data-model.md`, `contracts/*.schema.json`, `quickstart.md`

## Conventions

- TDD: Write failing tests before implementation.
- Parallel marker: [P] means tasks can run concurrently (different files / isolated concerns).
- IDs: T### sequential. Do not skip numbers.
- All paths relative to repo root unless noted.

## Legend

- (contract) Contract schema & validator test
- (model) Data structure & logic container
- (handler) WebSocket message handler / routing
- (service) Pure logic / orchestration module
- (integration) Multi-component test scenario
- (perf) Performance / load related
- (docs) Documentation updates
- (infra) Build / tooling / config

## Task List

### Setup & Infrastructure

1. **T001** [X] (infra) Ensure backend test utilities can load new schemas  
   Files: `shared/schemas/protocol/v1/*` (copy from feature contracts)  
   Steps: Copy 8 schemas (snapshot, run-end, engrave-_, join-_, flap-input) into shared path; export index.
   Outcome: Shared validator can import new schemas.
2. **T002** [X] (infra) Add schema validation wiring  
   Files: `backend/src/ws/validation.ts`  
   Steps: Register new message `type` → schema mapping; add snapshot / runEnd validators.  
   Outcome: Validation rejects malformed input before handler.
3. **T003** [X] (infra) Introduce physics constants & seed module  
   Files: `shared/src/physics/constants.ts`, `shared/src/track/seed.ts`  
   Steps: Define gravity, flap impulse, horizontal velocity, RNG seed function (crypto).  
   Outcome: Deterministic shared constants.
4. **T004** [X] (infra) Room config defaults module  
   Files: `backend/src/server/config/roomConfig.ts`  
   Steps: Export defaults: max_humans=20, bots_per_human=3, tick_hz=60, weights, engraving window, anti-cheat thresholds.  
   Outcome: Centralized config for new rooms.

### Models (Data Structures)

5. **T005** (model) Room model implementation [P]  
   Files: `backend/src/server/models/Room.ts`  
   Steps: Structure per data-model (fields, constructor, add/remove player, spawn bots, nextSeq()).  
   Outcome: Operational room abstraction.
6. **T006** (model) Run model implementation [P]  
   Files: `backend/src/server/models/Run.ts`  
   Steps: Track state, pipes_passed, distance, finalize(cause).  
   Outcome: Encapsulated run metrics & lifecycle.
7. **T007** (model) Player model implementation [P]  
   Files: `backend/src/server/models/Player.ts`  
   Steps: State transitions idle→active→ended, violation streak fields.  
   Outcome: Player lifecycle container.
8. **T008** (model) Bot model implementation [P]  
   Files: `backend/src/server/models/Bot.ts`  
   Steps: Mirror physics state + controller stub.  
   Outcome: Bot abstraction for simulation.
9. **T009** (model) Track & pipe window generation [P]  
   Files: `backend/src/server/models/Track.ts`  
   Steps: Deterministic generator (seed) producing windows on demand.  
   Outcome: On-demand track windows.
10. **T010** (model) Physics state & integrator [P]  
    Files: `backend/src/server/physics/integrator.ts`  
    Steps: applyTick(physics, inputs), flapImpulse().  
    Outcome: Deterministic physics step.
11. **T011** (model) Anti-cheat evaluation module [P]  
    Files: `backend/src/server/antiCheat/evaluator.ts`  
    Steps: detect violations (input rate, delta), manage streak counter.  
    Outcome: Boolean violation per tick.
12. **T012** (model) Engraving filter module [P]  
    Files: `backend/src/server/engraving/filter.ts`  
    Steps: Deny-list + charset + length validation.  
    Outcome: Reusable validator.

### Contract Tests (Before Handlers)

13. **T013** [X] (contract) Write snapshot schema test [P]  
    Files: `tests/contract/snapshot.contract.test.ts`  
    Steps: Validate required & rejection cases.
14. **T014** [X] (contract) Write runEnd schema test [P]  
    Files: `tests/contract/run-end.contract.test.ts`
15. **T015** [X] (contract) Write engrave request schema test [P]  
    Files: `tests/contract/engrave-request.contract.test.ts`
16. **T016** [X] (contract) Write engrave ack schema test [P]  
    Files: `tests/contract/engrave-ack.contract.test.ts`
17. **T017** [X] (contract) Write join request schema test [P]  
    Files: `tests/contract/join-room.contract.test.ts`
18. **T018** [X] (contract) Write join ack schema test [P]  
    Files: `tests/contract/join-ack.contract.test.ts`
19. **T019** [X] (contract) Write flap input schema test [P]  
    Files: `tests/contract/flap-input.contract.test.ts`

### Services / Orchestration

20. **T020** [X] (service) Room registry & assignment  
    Files: `backend/src/server/services/roomRegistry.ts`  
    Steps: findOrCreateRoom(), capacity checks, spawn bots per new human.
21. **T021** [X] (service) Run manager  
    Files: `backend/src/server/services/runManager.ts`  
    Steps: startRun(player), endRun(run, cause), scoreboard update.
22. **T022** [X] (service) Snapshot builder  
    Files: `backend/src/server/services/snapshotBuilder.ts`  
    Steps: assemble active, top (sort), pipes slice.
23. **T023** [X] (service) Engraving service  
    Files: `backend/src/server/services/engravingService.ts`  
    Steps: submitEngraving(run_id, name), deadline check, filter, mutate run.
24. **T024** [X] (service) Anti-cheat service integration  
    Files: `backend/src/server/services/antiCheatService.ts`  
    Steps: wrap evaluator; escalate removal; flag cause.
25. **T025** [X] (service) Bot controller logic  
    Files: `backend/src/server/services/botController.ts`  
    Steps: simple heuristic to flap before gap center.

### Handlers (Depends on Models + Services + Contract Tests)

26. **T026** [X] (handler) join handler  
    Files: `backend/src/server/handlers/join.ts`  
    Steps: validate, assign room, respond joinAck.
27. **T027** [X] (handler) flap handler  
    Files: `backend/src/server/handlers/flap.ts`  
    Steps: start run if idle, queue flap input.
28. **T028** [X] (handler) engraving handler  
    Files: `backend/src/server/handlers/engrave.ts`  
    Steps: validate window, call service, send engraveAck.
29. **T029** [X] (handler) tick loop integration  
    Files: `backend/src/server/sim/tickLoop.ts`  
    Steps: iterate rooms, physics, anti-cheat, finalize runs, broadcast snapshot.
30. **T030** [X] (handler) run end broadcast logic  
    Files: `backend/src/server/handlers/runEnd.ts`  
    Steps: unify broadcast path for manual & anti-cheat endings.

### Integration Tests

31. **T031** [X] (integration) Join→Flap→Collision→RunEnd scenario [P]  
    Files: `tests/integration/run-lifecycle.integration.test.ts`
32. **T032** [X] (integration) Engraving success & timeout [P]  
    Files: `tests/integration/engraving-window.integration.test.ts`
33. **T033** [X] (integration) Anti-cheat violation streak removal [P]  
    Files: `tests/integration/anti-cheat-removal.integration.test.ts`
34. **T034** [X] (integration) Snapshot ordering & dedupe [P]  
    Files: `tests/integration/snapshot-ordering.integration.test.ts`
    Steps: Inject out-of-order, duplicate, and gap (skip) snapshot sequences via a test harness; assert client logic (or validator) drops duplicates/out-of-order and logs gaps while maintaining monotonic application.
35. **T035** [X] (integration) Bot participation & fairness [P]  
    Files: `tests/integration/bot-fairness.integration.test.ts`

### Performance / Instrumentation

36. **T036** [X] (perf) Snapshot size & build time measurement  
    Files: `tests/perf/snapshot-size.perf.test.ts`
37. **T037** [X] (perf) Anti-cheat evaluation latency  
    Files: `tests/perf/anti-cheat.perf.test.ts`
38. **T038** [X] (perf) Tick drift monitoring hooks  
    Files: `backend/src/server/metrics/tickMetrics.ts`

### Additional Test Coverage (Inserted before further implementation to maintain TDD)

52. **T052** [X] (contract) Termination cause enum coverage test [P]  
    Files: `tests/contract/termination-cause-enum.contract.test.ts`  
    Steps: Assert allowed causes exactly match spec list; fail if extra or missing.  
    Outcome: Guard against accidental enum drift.
53. **T053** [X] (infra) Sync snapshot schema to shared & align naming  
    Files: `shared/schemas/protocol/v1/snapshot.schema.json`, `specs/002-the-gameplay-loop/contracts/snapshot.schema.json`  
    Steps: Compare feature snapshot schema & shared version; update or note differences; ensure naming consistent with plan references.  
    Outcome: Single authoritative snapshot schema.
54. **T054** [X] (integration) Engraving immutability enforcement [P]  
    Files: `tests/integration/engraving-immutability.integration.test.ts`  
    Steps: Submit engraving, attempt second submission → expect rejection (reason=immutable).  
    Outcome: FR-016 covered.
55. **T055** [X] (integration) Unique run_id generation & immutability [P]  
    Files: `tests/integration/runid-uniqueness.integration.test.ts`  
    Steps: Start multiple runs across rooms; assert uniqueness; attempt mutation via handler (should fail).  
    Outcome: FR-018 covered.
56. **T056** [X] (integration) Bots exempt from anti-cheat removal [P]  
    Files: `tests/integration/bot-anti-cheat-exemption.integration.test.ts`  
    Steps: Force violation conditions for bots; assert not removed while player under same conditions is removed.  
    Outcome: FR-022 covered.
57. **T057** [X] (integration) Prevent concurrent second run [P]  
    Files: `tests/integration/concurrent-run-prevention.integration.test.ts`  
    Steps: While active, send additional flap messages initiating duplicate start; assert no new run_id issued.  
    Outcome: FR-024 covered.
58. **T058** [X] (integration) Next-tick removal visibility timing [P]  
    Files: `tests/integration/removal-timing.integration.test.ts`  
    Steps: Cause collision at seq S; assert entity absent starting snapshot seq S+1; verify presence at S.  
    Outcome: FR-026 covered.
59. **T059** [X] (unit) Identical flap impulse constant across entities [P]  
    Files: `tests/unit/physics-flap-impulse.test.ts`  
    Steps: Assert shared constant used by both player and bot integration path.  
    Outcome: FR-030 covered.
60. **T060** [X] (integration) Score tie-break by elapsed_ms [P]  
    Files: `tests/integration/score-tiebreak.integration.test.ts`  
    Steps: Create two runs with identical scores different elapsed_ms; assert ordering favors lower elapsed_ms.  
    Outcome: FR-011 tie-break covered.
61. **T061** [X] (integration) Multi-room capacity expansion [P]  
    Files: `tests/integration/multi-room-capacity.integration.test.ts`  
    Steps: Fill room to 20 humans; join another; assert new room created; bot ratios maintained.  
    Outcome: FR-029 covered.
62. **T062** [X] (unit) Anti-cheat threshold constants exported [P]  
    Files: `tests/unit/anti-cheat-thresholds.test.ts`  
    Steps: Assert max_inputs_per_second=8, max_position_delta_px=120 positive & immutable.  
    Outcome: FR-019 threshold testability enforced.
63. **T063** [X] (unit) Deterministic track seeding & window generation [P]  
    Files: `tests/unit/track-seeding-determinism.test.ts`  
    Steps: Using fixed seed, generate first N windows twice → deep equal; different seed → differ in at least one parameter.  
    Outcome: FR-003 / NFR-003 determinism confirmed.
64. **T064** [X] (contract) Registry manifest & mapping drift test [P]  
    Files: `shared/schemas/protocol/v1/registry.json`, `tests/contract/registry-manifest.contract.test.ts`  
    Steps: Assert every authoritative message type (join, joinAck, flap, snapshot, snapshot-v2, runEnd, engrave, engraveAck, capabilities, error) appears in registry with correct schema file reference; compute checksum (e.g., hash of schema file contents) and fail if registry checksum mismatches; ensure additive changes only (no removed types).  
    Outcome: Governance addendum enforcement for schema registration & drift detection.

### Polish / Docs / Misc

39. **T039** (docs) Update `.github/copilot-instructions.md` recent changes list  
    Files: `.github/copilot-instructions.md`
40. **T040** (docs) Extend quickstart with test commands  
    Files: `specs/002-the-gameplay-loop/quickstart.md`
41. **T041** (docs) Add README section referencing gameplay loop  
    Files: `README.md`
42. **T042** (infra) Accessibility / reduced motion audit placeholder  
    Files: `frontend/src/` (notes only)
43. **T043** (infra) Metrics configuration placeholders  
    Files: `backend/src/server/metrics/index.ts`
44. **T044** (infra) Lint & formatting enforcement for new folders  
    Files: `backend/package.json`, root lint config

### Final Validation

45. **T045** (integration) Full end-to-end multi-player room test (2 players + bots)  
    Files: `tests/integration/multiplayer-room.integration.test.ts`
46. **T046** (perf) p95 input-to-effect latency measurement harness  
    Files: `tests/perf/input-latency.perf.test.ts`
47. **T047** (integration) Disconnection cause run termination  
    Files: `tests/integration/disconnect-cause.integration.test.ts`
48. **T048** (integration) Engraving filtering denial cases  
    Files: `tests/integration/engraving-filter.integration.test.ts`

### Completion Gate

49. **T049** (docs) Update plan progress & mark implementation complete  
    Files: `specs/002-the-gameplay-loop/plan.md`
50. **T050** (infra) Final constitution audit & cleanup  
    Files: `specs/002-the-gameplay-loop/plan.md`
51. **T051** [X] (contract) Protocol version annotation & SemVer test  
    Files: `shared/schemas/protocol/v1/envelope.schema.json`, `tests/contract/protocol-version.contract.test.ts`

Tasks T036–T038 and T046 MUST only execute after all core correctness & coverage tests (T013–T035, T054–T063) pass to preserve TDD focus.

### Performance / Instrumentation Gating Note

1.  **T052** (contract) Termination cause enum coverage test [P]
    Outcome: Enforced protocol version visibility & SemVer format.  
    Steps: Ensure envelope or registry includes protocol_version field; write test asserting semantic version pattern and presence in all outbound messages (snapshot, runEnd, joinAck).  
    Files: `tests/contract/termination-cause-enum.contract.test.ts`  
    Steps: Assert allowed causes exactly match spec list; fail if extra or missing.  
    Outcome: Guard against accidental enum drift.
1.  **T053** (infra) Sync snapshot schema to shared & align naming  
    Files: `shared/schemas/protocol/v1/snapshot.schema.json`, `specs/002-the-gameplay-loop/contracts/snapshot.schema.json`  
    Steps: Compare feature snapshot schema & shared version; update or note differences; ensure naming consistent with plan references.  
    Outcome: Single authoritative snapshot schema.

## Parallelization Guide

- Models (T005–T012) can run in parallel after infra (T001–T004).
- Contract tests (T013–T019) all parallel.
- Services (T020–T025) parallel after models ready.
- Handlers sequential: join → flap → engraving → tickLoop → runEnd broadcast due to shared router registration.
- Integration tests (T031–T035) parallel after handlers implemented.
- Perf tasks (T036–T038) parallel after snapshot & anti-cheat logic exist.
- Polish tasks (T039–T044) mostly parallel; README update last to avoid merge churn.
- Final validation tasks (T045–T048) parallel once core stable.
- New coverage tasks: T052 can run alongside other contract tests; T051 after core schemas exist; T053 before contract tests finalize.

## Execution Example Commands

(Conceptual – executed by task runner / agent)

```
# Parallel bundle example
/run T005 T006 T007 T008 T009 T010 T011 T012
/run T013 T014 T015 T016 T017 T018 T019
```

## Notes

- Keep run model free of direct WS dependencies (pure logic) to maximize testability.
- Ensure anti-cheat thresholds configurable to avoid hard-coded magic numbers in tests.
- Use bigint-safe increment for seq to avoid precision loss after large uptime.

## Completion Criteria

All tasks T001–T064 completed; anti-cheat thresholds & protocol_version present; coverage tasks (T054–T064) pass; performance tasks executed only after correctness suite green; registry manifest enforces governance; constitution gates re-validated; quickstart runnable end-to-end with visible protocol version and deterministic track seeding reproducibility.
