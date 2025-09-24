# Quickstart: Gameplay Loop & Run Lifecycle

This guide shows how to start the server, connect a client, perform a run, and engrave a result using the new protocol messages.

## Prerequisites

- Node.js 20+
- Workspaces installed (root): `npm install`

## 1. Start Backend (Dev)

(In root)

```
npm --workspace backend run build:watch # if exists (placeholder)
npm --workspace backend start
```

The server should open a WebSocket endpoint (e.g. `ws://localhost:PORT` - confirm actual port once implemented).

## 2. Connect & Join

Example minimal Node client (diagnostic):

```ts
import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:3001");

ws.on("open", () => {
  ws.send(JSON.stringify({ type: "join" }));
});

ws.on("message", (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.type === "joinAck") {
    console.log("Joined room", msg.room_id);
    // Discover capabilities (FR-023)
    ws.send(
      JSON.stringify({ type: "capabilities_request", protocol_version: msg.protocol_version })
    );
    // Wait 1 second then send flap to start run
    setTimeout(
      () => ws.send(JSON.stringify({ type: "flap", client_time: Date.now() })),
      1000,
    );
  } else if (msg.type === "capabilities_response") {
    console.log("Supported features", msg.supported_features);
  } else if (msg.type === "snapshot") {
    // On first flap server will start including our entity in active states
  } else if (msg.type === "runEnd") {
    console.log("Run ended", msg.run_id, msg.cause, msg.score);
    // Attempt engraving
    ws.send(
      JSON.stringify({ type: "engrave", run_id: msg.run_id, name: "Pilot1" }),
    );
  } else if (msg.type === "engraveAck") {
    console.log("Engraving outcome", msg);
  }
});
```

## 3. Run Lifecycle Summary

1. Client sends `join`.
2. Server responds with `joinAck` containing room configuration.
3. Client sends `flap` to transition from idle→active (first run start) → receives updated `snapshot` entries containing its state.
4. On collision or other termination cause, server sends `runEnd`.
5. Client optionally sends `engrave` before the 120s window expires → receives `engraveAck`.
6. After run ends, another `flap` will start a new run (restart semantics).

## 4. Message Validation (Schemas & Registry)

Authoritative schemas live in `shared/schemas/protocol/v1/`.
Draft feature schemas (during design) live in `specs/002-the-gameplay-loop/contracts/` before reconciliation.
A `registry.json` (to be added) will map `type → schema` and be enforced by contract tests.
Validator wiring: `backend/src/ws/validation.ts` — add new message types (snapshot-v2, runEnd, engrave*, join*, flap) during implementation.

## 5. Testing Strategy Overview

- Contract tests: Validate each new schema shape (runEnd, snapshot/snapshot-v2, engrave*, join*, flap, protocol_version presence, termination cause enum)
- Integration tests: Simulate join→flap→collision→runEnd flow and engraving acceptance
- Anti-cheat tests: Simulate violation streak leading to removal (3 consecutive)
- Performance tests: Snapshot size & anti-cheat latency after correctness suite passes

## 6. Engraving Rules

- Length 1..24, allowed `[A-Za-z0-9 _-]`
- Non-unique globally
- Deny-list filtering applied (initial minimal set; TODO future expansion)

## 7. Snapshot-v2 Migration

`snapshot-v2` will be introduced additively to unify fields (room_id, seq, protocol_version, active, top, pipes). Legacy `snapshot` stays valid until a documented deprecation cycle completes (per governance). Clients may accept either during transition. Contract tests ensure both validate.

## 8. Troubleshooting

| Symptom                           | Likely Cause                            | Resolution                                           |
| --------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| snapshot-v2 rejected              | Schema not registered                   | Update validator map                                 |
| Anti-cheat removal too aggressive | Threshold mismatch or miscomputed delta | Verify constants export & position delta calculation |
| Track determinism test fails      | PRNG or seed handling bug               | Check splitmix64 step math & BigInt conversions      |
| Large snapshot size (>2KB)        | Excess entities or verbose fields       | Trim inactive data, validate top10 logic             |

## 9. Development Flow Recap

1. Ensure/add schemas & registry (T001, T053)
2. Write contract tests (T013–T019, T051–T052)
3. Implement models/services (T005–T025)
4. Implement handlers & tick loop (T026–T030)
5. Run integration tests (T031–T035, extended T054+)
6. Add perf & metrics (T036–T038, T043)
7. Finalize plan updates & audits (T049–T050)

## Reference Artifacts

- Spec: `specs/002-the-gameplay-loop/spec.md`
- Research: `specs/002-the-gameplay-loop/research.md`
- Data Model: `specs/002-the-gameplay-loop/data-model.md`
- Contracts: `specs/002-the-gameplay-loop/contracts/`
