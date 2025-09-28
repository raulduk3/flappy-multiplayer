# Tasks — Barebones communication system

Branch: 001-establish-a-barebones
Spec: /Users/richardalvarez/Dev/flappy-multiplayer/specs/001-establish-a-barebones/spec.md
Plan: /Users/richardalvarez/Dev/flappy-multiplayer/specs/001-establish-a-barebones/plan.md

## Execution Guidance

- TDD: write failing tests first (contract + integration), then implement until green.
- Structure: create `src/server`, `src/client`, and `shared/schemas/protocol/v1` during implementation.
- Parallelism: tasks marked [P] can run concurrently (different files). Tasks without [P] must run sequentially.

## Numbered Tasks

[X] T001 — Initialize Node project

- Create `/Users/richardalvarez/Dev/flappy-multiplayer/package.json` with Node.js ≥20.
- Add scripts: `dev`, `test`, `test:watch`, `start`, `build` (if using ts-node, build can be noop initially).
- DevDeps: `typescript`, `vitest`, `ts-node`, `@types/node`.
- Deps: `ws`, `ajv`, `uuid`, `pino`.
- Output: package.json with scripts and deps installed.

[X] T002 — TypeScript baseline & workspace scaffolding

- Add `/Users/richardalvarez/Dev/flappy-multiplayer/tsconfig.json` (esnext, moduleResolution node, strict true).
- Create directories:
  - `/Users/richardalvarez/Dev/flappy-multiplayer/src/server`
  - `/Users/richardalvarez/Dev/flappy-multiplayer/src/client`
  - `/Users/richardalvarez/Dev/flappy-multiplayer/src/shared`
  - `/Users/richardalvarez/Dev/flappy-multiplayer/tests/contract`
  - `/Users/richardalvarez/Dev/flappy-multiplayer/tests/integration`
- Output: tsconfig + directory structure.

[X] T003 — Define TypeScript types for entities [P]

- Create `/Users/richardalvarez/Dev/flappy-multiplayer/src/shared/types.ts` with:
  - Envelope, TestPingPayload, AckSuccessPayload, AckErrorPayload, LogEntry types matching data-model.md.
- Output: typed contracts aligned with JSON Schemas.

[X] T004 — Validator utilities [P]

- Create `/Users/richardalvarez/Dev/flappy-multiplayer/src/shared/schema.ts`:
  - Load JSON Schemas from `shared/schemas/protocol/v1`.
  - Export `validateEnvelope`, `validateTestPing`, and factory for ack validation (success/error) using Ajv.
- Output: reusable validation helpers.

[X] T005 — Logger utility [P]

- Create `/Users/richardalvarez/Dev/flappy-multiplayer/src/shared/logging.ts`:
  - Export a pino logger configured for structured JSON.
  - Helper to emit LogEntry with fields: timestamp, session_id, direction, protocol_version, type, message_id.
- Output: consistent structured logs.

[X] T006 — Copy protocol schemas to shared

- Copy from feature contracts to `/Users/richardalvarez/Dev/flappy-multiplayer/shared/schemas/protocol/v1/`:
  - `envelope.schema.json`
  - `test.ping.request.schema.json`
  - `test.ping.ack.success.schema.json`
  - `ack.error.schema.json`
- Output: shared schemas available under `shared/schemas/protocol/v1`.

T007 — Contract tests: envelope schema [P]

- Create `/Users/richardalvarez/Dev/flappy-multiplayer/tests/contract/envelope.schema.test.ts` using Vitest.
- Validate positive and negative examples against `envelope.schema.json` via Ajv.
- Output: failing test (until validators wired and schemas in place).

T008 — Contract tests: test.ping request [P]

- Create `/Users/richardalvarez/Dev/flappy-multiplayer/tests/contract/test.ping.request.schema.test.ts`.
- Validate payload `{ nonce: "abc" }` (ok) and `{}` (fail).
- Output: failing test.

T009 — Contract tests: ack success [P]

- Create `/Users/richardalvarez/Dev/flappy-multiplayer/tests/contract/test.ping.ack.success.schema.test.ts`.
- Validate `{ status: "ok", nonce: "abc", message_id: "m1" }` (ok) and missing fields (fail).
- Output: failing test.

T010 — Contract tests: ack error [P]

- Create `/Users/richardalvarez/Dev/flappy-multiplayer/tests/contract/ack.error.schema.test.ts`.
- Validate `{ status: "error", reason: "validation failed", message_id: "m1" }` (ok) and missing fields (fail).
- Output: failing test.

[X] T011 — Integration test: connect → ping → ack

- Create `/Users/richardalvarez/Dev/flappy-multiplayer/tests/integration/ping-ack.test.ts` with Vitest.
- Boot server (ephemeral port), connect with ws client, send envelope `{ protocol_version: "1.0", type: "test.ping", payload: { nonce: "abc" } }`.
- Expect ack payload `{ status: "ok", nonce: "abc", message_id: string }` and verify log entries contain required fields.
- Output: failing test (server not implemented yet).

[X] T011b — Integration test: unsupported protocol_version → error ack

- Create `/Users/richardalvarez/Dev/flappy-multiplayer/tests/integration/protocol-version-unsupported.test.ts` with Vitest.
- Boot server, connect, send envelope `{ protocol_version: "0.9", type: "test.ping", payload: { nonce: "abc" } }`.
- Expect error ack `{ status: "error", reason: string, message_id: string }` indicating unsupported protocol version.
- Output: failing test (server not implemented yet).

T012 — Implement WebSocket server

- Create `/Users/richardalvarez/Dev/flappy-multiplayer/src/server/index.ts`:
  - Start ws server; on connection assign `session_id`.
  - On message: parse JSON; validate envelope and test.ping; generate `message_id`.
  - On success: send `{ status: "ok", nonce, message_id }`.
  - On failure: send `{ status: "error", reason, message_id }`.
  - Emit structured logs for inbound/outbound with required fields.
- Output: runnable server.

T013 — Implement fake client

- Create `/Users/richardalvarez/Dev/flappy-multiplayer/src/client/fake-client.ts`:
  - Connect to server; send test.ping with nonce; print ack; close connection (client closes).
- Output: minimal client.

T014 — Make contract tests pass

- Ensure validators load correct schemas and enforce rules; fix any mismatches between types and schemas.
- Output: all tests under `tests/contract` passing.

T015 — Make integration test pass

- Ensure ack shapes and logging match spec; add teardown hooks; stabilize timing.
- Output: ping-ack integration test passing.

[X] T016 — Quickstart polish [P]

- Update `/Users/richardalvarez/Dev/flappy-multiplayer/specs/001-establish-a-barebones/quickstart.md` with concrete npm scripts once available.
- Output: finalized quickstart.

[X] T017 — Agent context sync [P]

- Re-run `.specify/scripts/bash/update-agent-context.sh copilot` to capture any new tech (ws, ajv, pino, vitest).
- Output: updated `.github/copilot-instructions.md`.

## Dependencies & Ordering

- T001 → T002 → T003 [P] → (T004 [P], T005 [P]) → T006 → (T007–T010 [P]) → T011 → T011b → T012 → T013 → T014 → T015 → (T016 [P], T017 [P])

## Parallel Execution Examples

- Group 1 [P]: T004, T005, T006 (different files under src/shared)
- Group 2 [P]: T007–T010 (each test file independent)
- Group 3 [P]: T016, T017 (docs and agent sync)

## Agent Command Examples

- /tasks run T007
- /tasks run T008
- /tasks run T009
- /tasks run T010
- /tasks run T011
- /tasks run T012
