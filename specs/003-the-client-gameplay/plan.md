# Implementation Plan: Client Gameplay Loop & Canvas Rendering

**Branch**: `003-the-client-gameplay` | **Date**: 2025-09-24 | **Spec**: `/specs/003-the-client-gameplay/spec.md`
**Input**: Feature specification from `/specs/003-the-client-gameplay/spec.md`

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

Implement a server-authoritative client gameplay loop rendered at 60 fps using Canvas 2D rectangles only. The client captures flap inputs from keyboard/mouse/touch, assigns monotonically increasing sequence numbers, sends each input immediately (no batching), queues while disconnected, and applies short local prediction (≤150 ms) until authoritative snapshots arrive. On snapshot receipt, the client reconciles and snaps immediately if the radial divergence exceeds 10 px. The Game page includes three sub-states (pre-run, run, engrave) with a persistent top-ten leaderboard overlay. Rendering scales a canonical 288×512 logical resolution responsively for desktop browsers (Chrome, Firefox, Safari, Edge) ≥ 1024×768, preserving aspect ratio. Engraving names are limited to ≤24 printable ASCII characters. Frame delta is clamped to 50 ms on resume to avoid animation spikes. Connection states are visible and stale snapshots/inputs are ignored.

## Technical Context

**Language/Version**: TypeScript (Next.js latest on Node LTS)  
**Primary Dependencies**: Next.js, Tailwind CSS, Canvas 2D API; existing ws backend and Ajv-validated schemas  
**Storage**: N/A (no client persistence required)  
**Testing**: Jest (unit, integration, contract where applicable)  
**Target Platform**: Desktop browsers (Chrome, Firefox, Safari, Edge) ≥ 1024×768  
**Project Type**: web (frontend + backend present)  
**Performance Goals**: 60 fps rendering; prediction window ≤ 150 ms; snap at 10 px radial divergence  
**Constraints**: Rectangles-only Canvas for core entities; server-authoritative; preserve 288×512 aspect ratio; clamp frame delta to 50 ms  
**Scale/Scope**: Single Game page with three sub-states + overlay leaderboard; multi-room server already implemented

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- TDD first: Design artifacts and tests precede UI implementation (to be enforced in tasks). PASS
- Server-authoritative: Client never authors official state; reconciliation defined. PASS
- Shared, versioned contracts: Client consumes shared protocol schemas; no new protocol. PASS
- Secure and fair: Uses existing wss; ignores stale/duplicate messages; anti-cheat remains server-side. PASS
- Accessibility & minimal UI: Retro/brutalist UI with clear states; a11y notes to be refined during implementation. PASS (with follow-up)
- Performance posture: 60 fps target, delta clamp 50 ms, prediction cap 150 ms. PASS

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

**Structure Decision**: Option 2: Web application (frontend + backend detected)

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

**Output**: research.md with all major unknowns resolved (minor visual polish items may remain)

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

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

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

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
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved (minor: leaderboard dense tie display style, engrave cancel affordance)
- [ ] Complexity deviations documented

---

_Based on Constitution v1.0.0 - See `/.specify/memory/constitution.md`_
