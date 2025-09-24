# Tasks: Real-time Multiplayer WebSocket Protocol

Input: Design documents from `/specs/001-a-real-time/`
Prerequisites: plan.md (required), research.md, data-model.md, contracts/

Feature Directory: `/Users/richardalvarez/Dev/flappy-multiplayer/specs/001-a-real-time`
Available Design Docs: `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/message-envelopes.schema.json`

Note: Follow TDD; emphasize FR-023 (capabilities discovery) while covering protocol foundations.

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
   → quickstart.md: Extract user stories → integration tests
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: schemas, server handlers, client services
   → Integration: wiring, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- Web app structure per plan.md: `backend/src/`, `frontend/src/`, `shared/`

## Phase 3.1: Setup

- [x] T001 Ensure repo structure per plan: `backend/`, `frontend/`, `shared/` exist; create missing folders.
- [x] T002 Initialize backend test/dev deps (Node/TS/Jest/Ajv): update `backend/package.json` with Jest, ts-jest, TypeScript, Ajv; add scripts `test`, `lint`.
- [x] T003 [P] Initialize frontend test/dev deps (Next.js/TS/Jest): update `frontend/package.json`; add scripts `test`, `lint`.
- [x] T004 [P] Initialize shared package for schemas/types: create `shared/package.json` with TypeScript and JSON Schema tooling; add scripts `build`, `lint`.
- [x] T005 Create shared schema directory layout: `shared/schemas/protocol/v1/` with README explaining SemVer and file naming.

Dependencies: T001 → T002–T005. T002–T004 can run in parallel once T001 is done.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

Contract tests (per contracts/), schema tests (per entities), and integration tests (per stories). Include FR-023 tests.

- [x] T006 [P] Contract test: envelope types parity with contract in `backend/tests/contract/envelope.contract.test.ts`
  - Read `specs/001-a-real-time/contracts/message-envelopes.schema.json`
  - Validate against planned schema structure in `shared/schemas/protocol/v1/envelope.schema.json` (to be created in T017) to include: `hello`, `welcome`, `error`, `input`, `engrave`, `snapshot`, `runStart`, `runEnd`, `capabilities_request`, `capabilities_response`.

- [x] T007 [P] Contract test: FR-023 request/response shapes in `backend/tests/contract/capabilities.contract.test.ts`
  - Validate JSON against `shared/schemas/protocol/v1/capabilities-request.schema.json` and `.../capabilities-response.schema.json` using Ajv.
  - Negative cases: missing protocol_version fails; unexpected required fields fail.

- [x] T008 [P] Schema contract tests for entities in `backend/tests/contract/schema-entities.contract.test.ts`
  - Validate sample objects for: `PlayerState`, `PipesWindow`, `LeaderboardEntry`, `Snapshot` (schemas under `shared/schemas/protocol/v1/`).
  - Include edge cases from spec (aligned arrays, `at = server_tick`, enum states).
  - Include FR-023 schema validation: test `capabilities_request` and `capabilities_response` message shapes.

- [x] T009 Integration test: handshake gating in `backend/tests/integration/handshake.integration.test.ts`
  - Connect WS, send `hello` with compatible MAJOR → expect `welcome`.
  - Send any message (e.g., `capabilities_request`) before `welcome` → expect `{type:"error", code:"unsupported_action"}`.

- [x] T010 [P] Integration test: FR-023 capabilities flow in `backend/tests/integration/capabilities.integration.test.ts`
  - After `welcome`, send `{type:"capabilities_request", protocol_version}`.
  - Expect `{type:"capabilities_response", protocol_version, supported_features:[string]}` with a non-empty string array.

- [x] T011 [P] Integration test: error semantics in `backend/tests/integration/errors.integration.test.ts`
  - Incompatible MAJOR → `{type:"error", code:"incompatible_protocol"}`
  - Malformed message → `{type:"error", code:"validation_error"}`
  - Unsupported action/context → `{type:"error", code:"unsupported_action"}`

- [x] T012 [P] Integration test: input sequencing and deduplication in `backend/tests/integration/input-sequencing.integration.test.ts`
  - Send seq:1,2,2,3; assert dedupe and monotonic sequence per client.

- [x] T013 [P] Integration test: snapshot ordering and stale ignore in `backend/tests/integration/snapshot-ordering.integration.test.ts`
  - Assert server_tick strictly increases; client ignores out-of-order snapshot.

- [x] T014 [P] Integration test: run lifecycle in `backend/tests/integration/run-lifecycle.integration.test.ts`
  - Validate `runStart` and `runEnd` fields and transitions.

- [x] T015 [P] Integration test: engrave validation in `backend/tests/integration/engrave-validation.integration.test.ts`
  - Enforce name policy (≤24 chars, charset per spec); invalid → error.

- [x] T016 [P] Unit test: AJV message validator wrapper in `shared/tests/unit/message-validator.spec.ts`
  - Compile once, validate(), error mapping assertions.

Dependencies: T006–T016 depend on T002–T005. T006, T007, T008, T010, T011, T012, T013, T014, T015, T016 can run in parallel. T009 may require a basic server bootstrap (scaffold in test file or after T019).

## Phase 3.3: Core Implementation (ONLY after tests are failing)

Schemas (shared), Server (backend), Client (frontend). Implement minimally to satisfy tests.

- [x] T017 Create envelope JSON Schema in `shared/schemas/protocol/v1/envelope.schema.json`
  - Include union of message `type` values incl. FR-023: `capabilities_request`, `capabilities_response`.
  - Export `$id` and `$schema` for Ajv; document SemVer rules in header.

- [x] T018 [P] Add FR-023 schemas in `shared/schemas/protocol/v1/capabilities-request.schema.json` and `.../capabilities-response.schema.json`
  - Request: `{type:"capabilities_request", protocol_version}`
  - Response: `{type:"capabilities_response", protocol_version, supported_features:[string]}`

- [x] T019 [P] Add entity schemas in `shared/schemas/protocol/v1/`:
  - `player-state.schema.json`, `pipes-window.schema.json`, `leaderboard-entry.schema.json`, `snapshot.schema.json`
  - Ensure `LeaderboardEntry.at` equals `Snapshot.server_tick`; document tie-break logic per spec.

- [x] T020 Backend message validation utility in `backend/src/ws/validation.ts`
  - Initialize Ajv (strict), pre-compile schemas; export `validate(type, payload)`.

- [x] T021 Backend WebSocket router with handshake gate in `backend/src/ws/router.ts`
  - Reject any non-`hello` message pre-`welcome` with `error` `unsupported_action`.
  - Route `capabilities_request` post-welcome.

- [x] T022 Backend capabilities handler per FR-023 in `backend/src/ws/handlers/capabilities.ts`
  - Respond `{type:"capabilities_response", protocol_version, supported_features}`.
  - Minimal list: `["snapshot","runStart","runEnd","capabilities"]`.

- [x] T023 [P] Backend error mapping in `backend/src/ws/errors.ts`
  - Map validation errors → `validation_error`, unsupported → `unsupported_action`, version mismatch → `incompatible_protocol`.

- [x] T024 [P] Wire backend server bootstrap (test harness) in `backend/src/server.ts`
  - Start WS server for tests; export `createServer()` and `close()`.

- [x] T025 Backend input handler with per-player seq dedup in `backend/src/server/handlers/input.ts`
  - Maintain lastSeq per connection; enqueue valid inputs.

- [x] T026 Server tick scheduler and snapshot broadcasting (60 Hz) in `backend/src/server/sim/tickLoop.ts`
  - Deterministic state update loop; broadcast `snapshot` with `server_tick` and compact `pipes_window`.

- [x] T027 Run lifecycle (runStart/runEnd) in `backend/src/server/handlers/runLifecycle.ts`
  - Generate `run_id`; send `runStart` on first start/join; compute score; send `runEnd` on end.
  - NOTE: Auto runEnd now implemented via timeout to satisfy T014 integration test.

- [x] T028 Engrave handler with name policy in `backend/src/server/handlers/engrave.ts`
  - Enforce length ≤ 24 and charset; update leaderboard entry with `rank` and `at`.

- [x] T029 Frontend client service: capabilities discovery in `frontend/src/services/protocol.ts`
  - After `welcome`, send `capabilities_request`; store `supported_features`.

Dependencies: T017 → T018–T020. T020 → T021–T023. T021 → T022. T024 unblocks integration tests. T025–T028 implement acceptance flows. T029 depends on handshake but can be scaffolded with mocks.

## Phase 3.4: Integration

- [x] T030 Log and trace: add minimal structured logging in `backend/src/ws/log.ts` and instrument router/handlers.
- [x] T031 [P] Frontend UI stub: debug panel to show `supported_features` in `frontend/src/components/DebugCapabilities.tsx` and a hook `useCapabilities()`.
- [x] T032 [P] Update quickstart to include capabilities flow in `specs/001-a-real-time/quickstart.md` (append example request/response).

Dependencies: T030 after T021–T022. T031 after T029. T032 after FR-023 implementation passes tests.

## Phase 3.5: Polish

- [x] T033 [P] Unit tests: router/error mapping in `backend/tests/unit/ws-errors.test.ts` and validation util in `backend/tests/unit/validation.test.ts`.
- [x] T034 Lint/typecheck fixes across backend/frontend/shared; ensure `npm run lint` passes at root.
- [x] T035 [P] Docs: Add `shared/README.md` describing schema versioning and how to add new message types per SemVer.
- [x] T036 [P] Performance sanity: Ajv compile once; add micro-benchmark in `backend/tests/perf/validation.perf.test.ts` asserting <2ms/validate (skippable in CI).
- [x] T037 Housekeeping: CI-friendly test scripts; add `test:watch` where useful.

Dependencies: After core implementation is green.

## Dependencies (summary)

- Setup (T001–T005) → Tests (T006–T016) → Core (T017–T029) → Integration (T030–T032) → Polish (T033–T037)
- Models/schemas (T017–T019) before services/handlers (T020–T028)
- Server bootstrap (T024) before integration tests requiring a running server

## Parallel Execution Examples

```
# Launch schema/contract tests in parallel once setup is done:
Task: "T006 Contract test envelope parity in backend/tests/contract/envelope.contract.test.ts"
Task: "T007 Contract test FR-023 request/response in backend/tests/contract/capabilities.contract.test.ts"
Task: "T008 Schema contract tests for entities in backend/tests/contract/schema-entities.contract.test.ts"
Task: "T010 Integration test capabilities flow in backend/tests/integration/capabilities.integration.test.ts"
Task: "T011 Integration test error semantics in backend/tests/integration/errors.integration.test.ts"
Task: "T012 Integration test input sequencing in backend/tests/integration/input-sequencing.integration.test.ts"
Task: "T013 Integration test snapshot ordering in backend/tests/integration/snapshot-ordering.integration.test.ts"

# Implement shared schemas and utilities in parallel:
Task: "T018 Add FR-023 schemas under shared/schemas/protocol/v1/"
Task: "T019 Add core entity schemas under shared/schemas/protocol/v1/"
Task: "T023 Backend error mapping in backend/src/ws/errors.ts"
Task: "T024 Wire backend server bootstrap in backend/src/server.ts"
```

## Validation Checklist

- [ ] All contracts in `contracts/` have corresponding tests (T006)
- [ ] FR-023 has explicit contract tests (T007) and integration coverage (T010)
- [ ] All entities in `data-model.md` have schema tasks/tests (T008, T019)
- [ ] Tests precede implementation for every deliverable
- [ ] [P] tasks do not modify the same file concurrently
- [ ] Each task references concrete paths
