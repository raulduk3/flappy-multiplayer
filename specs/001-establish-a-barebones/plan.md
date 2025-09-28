# Implementation Plan: Barebones communication system

**Branch**: `001-establish-a-barebones` | **Date**: 2025-09-25 | **Spec**: `/Users/richardalvarez/Dev/flappy-multiplayer/specs/001-establish-a-barebones/spec.md`
**Input**: Feature specification from `/specs/001-establish-a-barebones/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Loaded
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → No blocking ambiguities: Clarifications section present (Session 2025-09-25)
3. Fill the Constitution Check section based on the constitution document.
4. Evaluate Constitution Check section below
   → PASS (no violations detected for this scope)
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → Completed (see research.md)
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific file
   → Completed (artifacts created below)
7. Re-evaluate Constitution Check section
   → PASS (design remains aligned)
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

## Summary
Establish a minimal, schema-validated client↔server communication path using a shared protocol envelope (protocol_version, type, payload). Server validates a `test.ping` message, responds with an acknowledgement, and both sides log structured JSON with correlation via server-generated message_id. No gameplay.

## Technical Context
**Language/Version**: Node.js ≥20  
**Primary Dependencies**: WebSocket transport, JSON Schema validation, UUID, structured logging  
**Storage**: N/A  
**Testing**: Contract tests asserting JSON Schemas; basic integration smoke for connect→ping→ack  
**Target Platform**: macOS/Linux dev, server runtime (Node.js)  
**Project Type**: single (server, shared, simple client script)  
**Performance Goals**: Not applicable for this step; correctness only  
**Constraints**: Deterministic logging with message_id, server-authoritative posture, additive protocol  
**Timeouts**: Client ack wait timeout is 3 seconds for this step  
**Scale/Scope**: Single connection, single round-trip only

## Constitution Check
PASS — Design extends shared protocol concept, server authoritative, contract-first, deterministic replay with message_id, production security noted (TLS/WSS for prod). No client-side gameplay state.

## Project Structure

### Documentation (this feature)
```
specs/001-establish-a-barebones/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── envelope.schema.json
    ├── test.ping.request.schema.json
    ├── test.ping.ack.success.schema.json
    └── ack.error.schema.json
```

### Source Code (repository root)
```
src/
├── server/            # websocket server (to be added in implementation)
├── client/            # fake client script (to be added)
└── shared/            # shared schemas (moved from specs/contracts during impl)

tests/
├── contract/
└── integration/
```

**Structure Decision**: Single project; add `src/server`, `src/client`, and `src/shared`. During implementation, copy/extend schemas into `shared/schemas/protocol/v1`.

## Phase 0: Outline & Research
Key unknowns resolved via Clarifications:
- Canonical test message: type `test.ping`, payload `{ nonce: string }`.
- Success ack payload: `{ status: "ok", nonce: string, message_id: string }`.
- Error ack payload: `{ status: "error", reason: string, message_id: string }`.
- Connection lifecycle: server keeps open; client closes after ack.
- Correlation: server generates `message_id` for inbound; includes in ack and logs.

Outputs: `research.md` documents decisions, rationale, and alternatives.

## Phase 1: Design & Contracts
Entities captured in `data-model.md`: Protocol Envelope, Ack Success, Ack Error, Log Entry.

Contracts produced under `contracts/` as JSON Schemas for envelope and message payloads. These will be relocated under `shared/schemas/protocol/v1` during implementation to comply with the Constitution.

Quickstart describes a minimal flow: start server → run fake client → observe JSON logs and ack.

Agent file updated with recent changes.

## Phase 2: Task Planning Approach (deferred to /tasks)
- Generate tasks from contracts and data model.
- TDD: write failing contract tests first (schema validation + integration ping/ack).
- Implement server with validation and logging, then minimal client.

## Complexity Tracking
None.

## Progress Tracking
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
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`
