# Contracts Notes (Client Consumption)

No new protocol messages are introduced by the client feature. The client consumes versioned shared schemas under `shared/schemas/protocol/v1`:

- envelope.schema.json → Input, Snapshot, RunStart, RunEnd, Error, Capabilities*
- snapshot.schema.json, player-state.schema.json, pipes-window.schema.json, leaderboard-entry.schema.json (if split)

Client-specific notes:
- Outbound Input messages use the envelope `Input` shape with fields: { type: "input", protocol_version, seq, action: "flap", ts }.
- Engrave messages (type: "engrave") use ASCII-only names with length 1–24.
- Client must reject/ignore any inbound message whose protocol_version is incompatible.

Testing guidance:
- Contract tests in frontend should validate that we serialize outbound Input/Engrave against the shared schemas and reject invalid payloads.
- Integration tests should simulate snapshots and assert reconciliation rules (snap at >10 px radial).
