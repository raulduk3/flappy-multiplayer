<!--
Sync Impact Report
- Version change: n/a → 1.0.0
- Modified principles: n/a (initial ratification)
- Added sections: Architecture & Operational Constraints; Development Workflow & Quality Gates
- Removed sections: none
- Templates requiring updates:
	✅ .specify/templates/plan-template.md (Constitution Check gates; footer path/version)
	✅ .specify/templates/spec-template.md (review checklist aligned to principles)
	✅ .specify/templates/tasks-template.md (tasks aligned to protocol/replay/security/accessibility)
	⚠️ .specify/templates/agent-file-template.md (no changes needed now; ensure future agent context mentions protocol/replay/security)
	⚠️ README.md / docs/* (not present) — consider adding quickstart aligning with Constitution
- Follow-up TODOs: none
-->

# Flappy Multiplayer Constitution

## Core Principles

### I. Unified Protocol, Authoritative Server
The game protocol is defined once under `shared/schemas/protocol/v1` and is the
sole source of truth for client–server interactions. The server is
authoritative over all gameplay state; clients send intents (e.g., flap, join)
and render server-confirmed outcomes.

- All feature specs MUST extend the shared protocol via backward-compatible
	additions (fields/messages). Forking or duplicating the protocol is forbidden.
- Any breaking protocol change requires a major version bump and a migration
	plan; prefer additive evolution and deprecation windows.
- Clients MUST reconcile to server state; local prediction is allowed but must
	be corrected on reconciliation.

Rationale: A single protocol and authoritative server prevent divergence,
enable fair multiplayer, and keep clients simple and replaceable.

### II. Test‑First, Contract‑Driven Development (NON‑NEGOTIABLE)
All work follows TDD. Contracts derived from the shared protocol drive tests
first; implementation follows only after failing tests exist.

- Red–Green–Refactor cycle is mandatory for every change.
- Contract tests MUST validate messages/endpoints against
	`shared/schemas/protocol/v1`.
- CI MUST fail if new behavior lacks tests or if tests pass without any failing
	state preceding implementation.

Rationale: Contract-first TDD ensures correctness and confidence in a
real-time system where regressions are costly.

### III. Deterministic Replay & Observability
Every interaction is logged for deterministic replay. Logs are structured,
timestamped, and correlated by session/match identifiers, sufficient to
reconstruct the authoritative state timeline.

- All inbound intents and outbound state updates MUST be logged with stable
	message IDs and monotonic timestamps.
- Replay tooling MUST restore server state transitions exactly from logs for a
	given seed and inputs; non-determinism must be isolated and controllable.
- Observability includes structured logs, metrics, and minimal tracing to debug
	latency and correctness issues.

Rationale: Replay makes debugging, anti-cheat review, and incident analysis
practical in a real-time game.

### IV. Simplicity, Thin Client, Accessibility
Keep the system easy to evolve: `server`, `client`, and `shared`. The client is
a thin renderer that fulfills server state with minimal logic and an
accessible, minimalist UI.

- No hidden gameplay logic on the client; only rendering, input capture, and
	latency coping (interpolation/prediction) with reconciliation.
- UI MUST meet baseline accessibility: keyboard-only play, screen reader labels
	for menus, sufficient color contrast, and no critical information conveyed by
	color alone.
- Prefer the simplest mechanism that works (YAGNI). Justify any added
	complexity in reviews.

Rationale: A thin client and simple architecture reduce maintenance cost and
broaden accessibility.

### V. Security by Default & Versioning Discipline
Production communication MUST be secure. Versioning MUST be explicit and
compatible by default.

- Use TLS (HTTPS/WSS) in production; configure certificate validation and
	sensible cipher settings. Secrets are never committed; use environment/config
	management.
- Validate and sanitize all inputs at trust boundaries; apply rate limiting and
	basic anti‑cheat measures server‑side.
- Protocol, server, and client follow SemVer. Prefer additive changes; breaking
	changes require migration notes and deprecation periods.

Rationale: Security and clear versioning protect players and enable smooth
evolution across releases.

## Architecture & Operational Constraints

- Project structure: three units — `server/`, `client/`, `shared/`.
- Protocol location: `shared/schemas/protocol/v1` (authoritative schemas,
	generators, and fixtures for tests/replay).
- Transport: real‑time channel (e.g., WebSocket). Protocol messages MUST be
	schema‑validated in both directions.
- Replay: store structured logs with rotation and data minimization. Retain
	only what’s needed for debugging and fairness reviews.
- Metrics: track tick latency, packet loss, reconciliation counts, and error
	rates. Avoid PII; redact where necessary.
- Performance: target smooth play at 60 fps client‑side and low server tick
	latency; set concrete budgets per feature as part of specs.

## Development Workflow & Quality Gates

1. Specification → extend protocol (no forks), define user stories and
	 acceptance criteria.
2. Planning → document Constitution Check, structure, and risks.
3. Design & Contracts → update schemas, generate fixtures, write contract and
	 integration tests (they MUST fail initially).
4. Implementation → make tests pass, keep client thin, wire replay logging and
	 metrics.
5. Review → verify Constitution compliance, security, accessibility, and replay
	 determinism. Update docs.

Quality Gates (PRs MUST satisfy):
- Tests-first evidence (commit order or CI gate) and comprehensive contract
	tests for protocol changes.
- Replay logging for new interactions.
- Server authoritative flow preserved; no client-only gameplay state.
- Accessibility acceptance criteria covered.
- TLS/security posture documented for prod paths.

## Governance

- This Constitution supersedes ad-hoc practices for this repository.
- Amendments occur via PR with rationale and migration notes. Version increases
	per SemVer: MAJOR for principle redefinitions/removals, MINOR for added
	principles/sections, PATCH for clarifications.
- Compliance is reviewed on every PR. Protocol changes require cross‑review by
	server and client maintainers.
- Deprecations MUST include timelines and compatibility notes. Version
	negotiation strategies belong in the shared protocol docs.

**Version**: 1.0.0 | **Ratified**: 2025-09-25 | **Last Amended**: 2025-09-25