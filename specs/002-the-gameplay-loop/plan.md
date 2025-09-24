# Implementation Plan: Gameplay Loop & Run Lifecycle

**Branch**: `002-the-gameplay-loop` | **Date**: 2025-09-24 | **Spec**: `/specs/002-the-gameplay-loop/spec.md`
**Input**: Feature specification from `/specs/002-the-gameplay-loop/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Implement a deterministic, server‑authoritative gameplay loop for multiplayer Flappy-style runs: players join rooms (≤20 humans) with bots spawned at a fixed ratio, start runs on first flap, advance under 60 Hz physics, terminate on collision/cheat/disconnect, and receive per‑tick snapshots (active states, top ten, pipe windows). Add engraving post‑run flow and anti‑cheat evaluation (input rate & position delta) with escalation (3 consecutive violations → removal). Contracts must extend existing v1 protocol (envelope + protocol_version) additively; a unified snapshot-v2 schema will reconcile divergent draft vs current v1 snapshot while preserving backward compatibility until deprecation per governance.

## Technical Context

**Language/Version**: TypeScript (Node.js 20 LTS backend), TypeScript (Next.js latest frontend)  
**Primary Dependencies**: ws (or uWebSockets.js planned), Ajv (JSON Schema validation), Jest (testing), crypto (built‑in), Tailwind (frontend styling)  
**Storage**: In‑memory (no persistent DB in scope for this feature)  
**Testing**: Jest (unit, integration, contract, perf)  
**Target Platform**: Server: Linux/macOS Node.js runtime; Client: modern browsers (Chrome/Firefox/Safari/Edge latest)  
**Project Type**: Web (frontend + backend + shared)  
**Performance Goals**: 60 Hz authoritative tick; snapshot payload ≤2 KB p95; input→effect latency ≤150 ms p95; anti‑cheat evaluation O(players) per tick with negligible (<0.1 ms median) overhead  
**Constraints**: Deterministic physics (fixed timestep), SemVer protocol governance, no breaking changes without MAJOR bump, ≤20 humans/room with 3 bots per human, anti‑cheat thresholds exported centrally  
**Scale/Scope**: Prototype scale (tens of concurrent rooms) but design choices should not preclude scaling (#players \* bots) to a few thousand connections with horizontal sharding.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle / Gate                         | Assessment                                                                                                                | Action / Mitigation                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| I. TDD (tests first)                     | Plan orders contract & integration tests before implementation tasks                                                      | Enforce via tasks ordering; no implementation without failing tests committed       |
| II. Server‑Authoritative Determinism     | 60 Hz tick, shared physics constants, deterministic track seeding with seed + PRNG                                        | Provide shared `physics/constants.ts`, `track/seed.ts`; tests T059, T063            |
| III. Minimal Accessible UI               | Feature adds no heavy UI libs; future accessibility tasks (T042) captured                                                 | Define a11y audit placeholder task; expand criteria later                           |
| IV. Secure + Fair Play                   | Anti‑cheat thresholds defined & centralized; schemas validated by Ajv                                                     | Export constants (T004/T062) and evaluator (T011)                                   |
| V. Shared Contracts & Versioned Protocol | Snapshot divergence identified; will introduce `snapshot-v2` additively under v1 with `type: snapshot` or versioned alias | Implement schema sync task (T053), add protocol_version to outgoing messages (T051) |
| Governance Addendum Compliance           | Draft feature contracts reconciled into `shared/schemas/protocol/v1` before merge                                         | Create/Update registry manifest & contract tests                                    |
| Enum Drift (termination causes)          | Termination cause list in spec FR-028 → add contract test (T052)                                                          | Schema enumeration + test ensures equality                                          |
| Backward Compatibility                   | Additive only (new fields optional); no removals of existing required fields in v1                                        | If removal needed, bump MAJOR (out of scope now)                                    |
| Observability Metrics                    | Placeholder metrics tasks (tick drift T038, protocol version gauge via later instrumentation)                             | Add metrics stubs now, populate later                                               |

Initial Verdict: PASS (no constitutional violations requiring mitigation before research). All deviations (snapshot schema divergence) have explicit reconciliation task (T053) and remain additive.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application: backend + frontend + shared) — already present; no restructure needed.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

Additional Research Focus Items:

- Evaluate XorShift64\* vs splitmix64 for deterministic pipe window generation (criteria: period, speed, ease of implementation in TS BigInt) → choose minimal predictable implementation.
- Confirm max snapshot size under projected entity counts (20 humans + 60 bots worst‑case) to validate ≤2 KB p95 target; record sizing assumptions.
- Anti‑cheat positional delta measurement reference frame (pre vs post physics) — spec states pre/post authoritative; ensure evaluator uses authoritative state delta only.
- Engraving filter initial deny‑list strategy (seed with small curated list + regex classes). Provide path for configuration updates.

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate Protocol Message Schemas** (WebSocket, not REST):
   - Messages: snapshot-v2, runEnd, join, joinAck, flapInput, engraveRequest, engraveAck, capabilities (existing), error envelope variants
   - Use JSON Schema draft-07 under `contracts/` then reconcile into `shared/schemas/protocol/v1` (additive) before merge
   - Provide `registry.json` draft mapping type→schema file

3. **Generate contract tests** from contracts:
   - One test file per message type
   - Assert validation success for minimal valid payload & failure cases (missing required, bad enum, pattern mismatch)
   - Snapshot size expectation test stub (perf gating later)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
   - Add NEW: snapshot-v2 contract, deterministic track seeding module, anti-cheat evaluator constants export
   - Preserve manual additions markers

**Output**: data-model.md, /contracts/\* (including snapshot-v2), failing contract tests, quickstart.md, agent-specific file updated

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 55-65 numbered, ordered tasks in tasks.md (expanded due to governance, perf, anti‑cheat, determinism, a11y placeholders) — aligns with existing extended task list (T001–T063 already drafted downstream; this plan documents rationale retroactively for transparency).

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) <!-- tasks.md already exists from prior workflow -->
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (Clarifications section present in spec)
- [ ] Complexity deviations documented (none currently)

---

_Based on Constitution v1.0.0 - See `/.specify/memory/constitution.md`_
