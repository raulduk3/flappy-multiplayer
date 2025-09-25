# Tasks: Client Gameplay Loop & Canvas Rendering

Input: Design documents from `/specs/003-the-client-gameplay/`
Prerequisites: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Phase 3.1: Setup

- [x] T001 Confirm frontend test harness configuration
  - File(s): `frontend/package.json` (jest config via scripts), `frontend/jest.config.*` (if present)
  - Action: Ensure jsdom env is configured; install/update `@testing-library/react` and `@testing-library/jest-dom` as needed; do not change existing Next.js deps.
  - Notes: No framework switch; use Next.js + React 18.

- [x] T002 [P] Create a minimal Canvas game page and shell
  - File: `frontend/src/pages/index.tsx`
  - Action: Add Canvas 2D element and a basic render loop scaffold (no gameplay logic yet). Expose connection state placeholders.
  - Dependency: T001

- [x] T003 [P] Add protocol client wiring in frontend
  - File: `frontend/src/services/protocol.ts` (reuse), `frontend/src/hooks/useCapabilities.ts` or new hook
  - Action: Verify hello→welcome→capabilities exchange; surface connection states to UI.
  - Dependency: T001

## Phase 3.2: Tests First (TDD)

- [x] T004 [P] Contract test: outbound Input serialization (type: "input")
  - File: `frontend/tests/contract/input.contract.test.ts`
  - Action: Validate payload structure `{ type, protocol_version, seq, action: "flap", ts }` against shared schema envelope `Input`.
  - Dependency: T001

- [x] T005 [P] Contract test: outbound Engrave serialization (type: "engrave")
  - File: `frontend/tests/contract/engrave.contract.test.ts`
  - Action: Validate `{ type: "engrave", protocol_version, run_id, name }` matches constraints (1–24 printable ASCII).
  - Dependency: T001

- [x] T006 [P] Integration test: prediction cap and reconciliation snap
  - File: `frontend/tests/integration/prediction-reconciliation.integration.test.tsx`
  - Action: Simulate delayed snapshots; ensure prediction runs ≤150 ms and snap occurs when radial error >10 px.
  - Dependency: T002

- [x] T007 [P] Integration test: connection states and input queuing
  - File: `frontend/tests/integration/connection-queue.integration.test.tsx`
  - Action: Simulate WS reconnect; verify queued inputs (seq strictly increasing) flush in order; stale acks ignored.
  - Dependency: T003

- [x] T008 [P] Integration test: engrave UI validation
  - File: `frontend/tests/integration/engrave-ui.integration.test.tsx`
  - Action: Validate Save disabled for invalid names and while pending; returns to pre-run after ack.
  - Dependency: T002, T003

- [x] T009 [P] Integration test: responsive scaling and aspect ratio
  - File: `frontend/tests/integration/scaling.integration.test.tsx`
  - Action: Verify 288×512 logical scene scales uniformly within ≥1024×768 viewport without distortion.
  - Dependency: T002

- [x] T010 [P] Integration test: transition to engrave on runEnd
  - File: `frontend/tests/integration/runend-transition.integration.test.tsx`
  - Action: Simulate authoritative runEnd message for local run; assert UI transitions to engrave state.
  - Dependency: T003

- [x] T011 [P] Unit test: diagnostic logging for stale/duplicate events
  - File: `frontend/tests/unit/logging.test.ts`
  - Action: Assert console logs occur when snapshots are stale or inputs duplicated (FR-022).
  - Dependency: T001

- [x] T012 [P] Unit test: render/leaderboard ordering mirrors server tie-break
  - File: `frontend/tests/unit/ordering.test.ts`
  - Action: Given equal scores and different elapsed_ms/run_id, assert ordering: score DESC, elapsed_ms ASC, run_id lexical.
  - Dependency: T001

## Phase 3.3: Core Implementation

- [x] T013 Implement render model and scaling utilities
  - File: `frontend/src/services/renderModel.ts`
  - Action: Provide logical→screen transforms; compute scale and letterboxing.
  - Dependency: T009 (tests specify expectations)

- [x] T014 Implement input sequencing and queue
  - File: `frontend/src/services/inputQueue.ts`
  - Action: Maintain seq counter; queue while disconnected; flush on open; drop seq <= last applied.
  - Dependency: T004, T007

- [x] T015 Implement prediction integrator with delta clamp
  - File: `frontend/src/services/prediction.ts`
  - Action: Gravity + flap impulse integration; clamp dt to 50 ms; cap prediction window at 150 ms.
  - Dependency: T006

- [x] T016 Implement reconciliation and snap logic
  - File: `frontend/src/services/reconciliation.ts`
  - Action: On snapshot, replace predicted state; if radial error >10 px, snap immediately.
  - Dependency: T006

- [x] T017 Wire Game component sub-states (pre-run, run, engrave)
  - File: `frontend/src/components/Game.tsx`
  - Action: Manage state machine; render canvas; overlay leaderboard; engrave UI.
  - Dependency: T002, T003, T013–T016

- [x] T018 Implement Canvas drawing (rectangles only)
  - File: `frontend/src/services/draw.ts`
  - Action: Draw players/bots/pipes/track as rectangles; follow server ordering for layering.
  - Dependency: T017

- [x] T019 Leaderboard overlay with dense ties
  - File: `frontend/src/components/Leaderboard.tsx`
  - Action: Render top ten; mirror server tie-break ordering; compact tie display.
  - Dependency: T017, T012

- [x] T020 Connection status UI and controls
  - File: `frontend/src/components/ConnectionIndicator.tsx`
  - Action: Show connecting/connected/reconnecting/error; disable Start until connected.
  - Dependency: T003, T017

- [x] T021 Engrave form and submission
  - File: `frontend/src/components/EngraveForm.tsx`
  - Action: Input validation (1–24 printable ASCII); Save disabled while pending; submit via protocol client.
  - Dependency: T005, T017

## Phase 3.4: Integration

- [x] T022 Integrate snapshot consumption and reconciliation
  - File: `frontend/src/services/protocol.ts` + `frontend/src/components/Game.tsx`
  - Action: On snapshot messages, update authoritative state and trigger reconciliation.
  - Dependency: T016–T018

- [x] T023 Hook input queue into protocol send path
  - File: `frontend/src/services/inputQueue.ts` + `frontend/src/services/protocol.ts`
  - Action: Send flap messages immediately when open; flush queued on reconnect.
  - Dependency: T014, T003

- [x] T024 Implement render loop and delta clamp
  - File: `frontend/src/pages/index.tsx` (or `frontend/src/components/Game.tsx`)
  - Action: requestAnimationFrame loop; apply prediction up to cap; draw; clamp dt to 50 ms on resume.
  - Dependency: T015, T018

## Phase 3.5: Polish & Docs

- [x] T025 [P] Unit tests for sequencing, reconciliation, and scaling
  - File(s): `frontend/tests/unit/*.test.ts`
  - Action: Cover edge cases (stale snapshots; seq duplicates; extreme resize).
  - Dependency: T013–T016

- [x] T026 [P] Performance sanity test for render loop
  - File: `frontend/tests/perf/render-loop.perf.test.ts`
  - Action: Ensure basic frame progression and no unbounded allocations.
  - Dependency: T024

- [x] T027 [P] Update docs and agent instructions
  - File(s): `specs/003-the-client-gameplay/quickstart.md`, `.github/copilot-instructions.md`
  - Action: Document new modules and how to run tests; update Recent Changes for this feature.
  - Dependency: T017–T024

- [x] T028 [P] Accessibility & styling compliance
  - File(s): `frontend/src/components/*`, `frontend/src/pages/index.tsx`
  - Action: Ensure keyboard navigation, ARIA labels, focus outlines; respect reduced motion; high-contrast palette applied per FR-021.
  - Dependency: T017–T021

## Dependencies Summary

- T001 → T002, T003
- Tests before implementation: T004–T009 must exist before T010–T018
- T010 → T015; T011 → T020; T012 → T021; T013 → T019; T014 → T015–T018

## Parallel Execution Examples

```
# Run contract and integration tests in parallel (write them to fail first)
Task: "T004 Contract test: outbound Input serialization"
Task: "T005 Contract test: outbound Engrave serialization"
Task: "T006 Integration test: prediction cap and reconciliation snap"
Task: "T007 Integration test: connection states and input queuing"
Task: "T008 Integration test: engrave UI validation"
Task: "T009 Integration test: responsive scaling and aspect ratio"
```
