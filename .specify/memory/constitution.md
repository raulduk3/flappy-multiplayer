<!--
Sync Impact Report
- Version change: None → 1.0.0
- Modified principles: N/A (initial adoption)
- Added sections: Core Principles; Technology & Constraints; Development Workflow, Review & Quality Gates; Governance
- Removed sections: None
- Templates requiring updates:
	✅ .specify/templates/plan-template.md (footer path to constitution)
	✅ .specify/templates/spec-template.md (no changes required)
	✅ .specify/templates/tasks-template.md (no changes required)
	✅ .specify/templates/agent-file-template.md (no changes required)
- Follow-up TODOs: None
-->

# Flappy Multiplayer Constitution

## Core Principles

### I. Test-Driven Development with Jest (NON-NEGOTIABLE)

- Tests MUST be written before implementation (Red → Green → Refactor).
- Jest is the standard test runner across frontend and backend.
- Each PR MUST include failing tests that demonstrate the change, then make them pass.
- Integration tests MUST cover multiplayer flows (connect, join, flap, collide, score, disconnect).
- Rationale: Ensures correctness in a real-time setting where regressions are easy to introduce.

### II. Server‑Authoritative, Deterministic Gameplay

- The Node.js server is the single source of truth.
- Simulation uses a fixed timestep of 60 Hz; no frame‑rate dependent logic is allowed.
- Clients MAY predict visuals but MUST reconcile to server state (timestamped inputs, idempotent updates).
- RNG, physics constants, and rules reside in the shared module and are identical on client and server.
- Rationale: Guarantees fair, consistent gameplay across devices and prevents desync/cheating.

### III. Minimal, Accessible UI (Tailwind + Canvas 2D)

- Styling uses Tailwind with a centered, flat, retro/brutalist aesthetic; avoid external UI kits.
- Canvas 2D is used for rendering; assets remain minimal to prioritize clarity and performance.
- Accessibility is mandatory: keyboard and touch input, high contrast, semantic landmarks, reduced‑motion support.
- Rationale: Consistency, performance, and inclusion without visual noise.

### IV. Secure Communications and Fair Play

- All realtime traffic uses Secure WebSockets (wss); plaintext ws is prohibited in production.
- Validate and rate‑limit all client inputs; reject impossible moves and suspicious rates.
- Do not store PII beyond what is strictly necessary for gameplay.
- Rationale: Protects users, deters cheating, and keeps the system reliable.

### V. Shared Contracts and Versioned Protocol

- Message schemas and gameplay constants live in `shared/` and are imported by both frontend and backend.
- Protocol changes follow SemVer: backward‑compatible = MINOR; breaking = MAJOR; docs/tests updated together.
- Contract tests MUST exist for message schemas and state transitions.
- Rationale: Prevents drift between client and server and makes upgrades predictable.

### VI. Protocol Contract Governance Addendum

Authoritative Schemas & Drafting Workflow:

- Only schemas located under `shared/schemas/protocol/v{MAJOR}/` are considered authoritative for any released protocol version.
- Feature branches MAY introduce or modify schema drafts inside their feature directory (e.g., `specs/{feature}/contracts/`), but these drafts MUST be reconciled (merged or explicitly discarded) before the branch is integrated.
- No production code SHOULD depend directly on feature-draft schemas; tests in feature branches MAY, but final contract tests MUST point to authoritative shared schemas.

Envelope & Version Declaration:

- Every message (client→server and server→client) MUST include a top-level `protocol_version` field and a `type` (message_type) field.
- `protocol_version` MUST follow semantic versioning format: `MAJOR.MINOR.PATCH` (e.g., `1.4.2`).
- A message lacking `protocol_version` or with a non‑SemVer value MUST be rejected during validation with an explicit error.

Evolution & Backward Compatibility Rules:

- Additive changes (MINOR / PATCH) MAY add new optional fields or new message types; existing required fields MUST NOT change semantic meaning, type, or nullability.
- A BREAKING change (field removal, rename, type change, making an optional field required, semantic repurpose) REQUIRES a MAJOR version increment and accompanying migration notes.
- Deprecated fields MUST be documented and MAY be removed only in the next MAJOR version after at least one MINOR release marking them as deprecated.

Fragment Reuse:

- Common structural fragments (e.g., player state, run summary, pipe window) SHOULD reside in `shared/schemas/protocol/v{MAJOR}/fragments/` (or equivalent) and be referenced via `$ref` to eliminate duplication.

Validation & Registry:

- A registry manifest (e.g., `shared/schemas/protocol/v{MAJOR}/registry.json`) SHOULD enumerate `message_type → schema file` mappings and MAY include checksums for CI drift detection.
- CI MUST fail if an unregistered schema is introduced, a checksum changes without an accompanying SemVer bump, or a non‑additive diff occurs without a MAJOR version increment.

Testing Requirements:

- Round‑trip (serialize/validate) tests MUST exist for each message type in the authoritative set.
- Compatibility tests MUST assert that previously valid messages (minus newly added optional fields) remain valid after non‑breaking updates.
- Enum drift guards (e.g., termination causes) MUST assert exact equality with spec enumerations.

Observability:

- The system SHOULD expose metrics: `protocol_active_version` (gauge) and `protocol_backward_compat_failures` (counter) to track compatibility incidents.

Non‑Negotiable:

- Any merge that introduces a breaking change without a corresponding MAJOR bump and documented migration is constitutionally invalid and MUST be reverted.

## Technology & Constraints

- Client: Next.js (latest), Tailwind CSS, Canvas 2D API.
- Server: Node.js (LTS), WebSocket server, secure (wss) in production.
- Communication: JSON messages over Secure WebSockets; schemas defined in `shared/` TypeScript types.
- Consistency Targets:
  - Fixed simulation tick: 60 Hz on server; clients render at device refresh rate but reconcile to 60 Hz state.
  - Canonical logical resolution: 288×512; UI scales proportionally to maintain aspect ratio.
  - Input‑to‑effect budget: ≤150 ms p95 end‑to‑end under normal network conditions; degrade gracefully above that.
- Performance/limits:
  - Typical message payload ≤2 KB; batch/join updates to avoid floods.
  - Avoid heavy runtime dependencies on the render path; keep frame budget headroom.
- Accessibility:
  - Keyboard: Space/Arrow‑Up to flap; Touch: tap; Provide ARIA labels for controls and menus.
  - Respect reduced motion preferences and maintain high contrast.

## Development Workflow, Review Process, Quality Gates

- Git workflow: short‑lived feature branches, small PRs, commit after each green test step.
- Quality gates (required for merge):
  - Jest unit/integration tests pass locally and in CI.
  - Constitution Check section in the plan passes without violations or with justified exceptions.
  - Protocol/schema changes include updated shared types, contract tests, and quickstart notes.
- Versioning:
  - Packages and protocol adhere to SemVer.
  - Breaking gameplay or protocol changes require a migration note in the PR description.
- Documentation:
  - Keep quickstart, contracts, and agent guidance in sync with changes that affect developers.

## Governance

- This constitution supersedes conflicting process docs.
- Amendments are proposed via PR, with a rationale and any migration guidance.
- Versioning of this document follows SemVer:
  - MAJOR: incompatible principle or governance changes.
  - MINOR: new principles/sections or materially expanded guidance.
  - PATCH: clarifications and non‑semantic edits.
- Compliance:
  - All PRs must be reviewed for adherence; violations require either refactor or documented justification.
  - Periodic compliance reviews ensure continued alignment with real‑time multiplayer constraints.

**Version**: 1.0.0 | **Ratified**: 2025-09-23 | **Last Amended**: 2025-09-23
