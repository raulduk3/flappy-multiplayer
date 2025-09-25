# flappy-multiplayer

- respecify #1 to scaffold complete game schema

Real-time multiplayer Flappy-style game prototype featuring:

- WebSocket protocol with versioned JSON Schemas (governed registry)
- Deterministic physics & track generation
- Run lifecycle (idle → active → ended) with scoreboard ordering & tie-breaks
- Anti-cheat evaluation (input rate & position delta) with bot exemption
- Engraving system (windowed submission + immutability + filtering)
- Capabilities negotiation (discover supported features at handshake)

## Packages

| Package   | Purpose |
|-----------|---------|
| `backend/` | Game server (TypeScript, ws, Ajv validation) |
| `shared/`  | Shared schemas, physics constants, track generation |
| `frontend/`| (Future) Client UI / debug components |

## Quick Start

Install workspaces:

```
npm install
```

Run backend tests:

```
npm --workspace backend test
```

(See `specs/002-the-gameplay-loop/quickstart.md` for full run lifecycle walkthrough.)

## Governance & Protocol

- All message schemas live under `shared/schemas/protocol/v1`.
- `registry.json` maps message `type` → schema file; contract test enforces completeness and additive change rules.
- Envelope & every message include `protocol_version` (SemVer) for compatibility checks.

## Development Notes

- Explicit `.ts` import specifiers with NodeNext module resolution are used to avoid inconsistent transpilation during tests.
- Restarting a run: After a run ends (collision, anti-cheat, etc.), the next `flap` begins a fresh run (handled in `flap.ts` + `runManager`).
- Scoreboard ordering: `score DESC, elapsed_ms ASC, run_id lexical`.

## Pending / Deferred (Next Milestone)

Deferred tasks (see tasks list) include: full multi-player E2E harness, disconnect termination test, broader engraving denial cases, and latency p95 harness.

## License

MIT
