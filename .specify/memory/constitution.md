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