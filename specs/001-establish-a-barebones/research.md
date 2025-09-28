# Research Summary — Barebones communication system

Date: 2025-09-25
Branch: 001-establish-a-barebones
Spec: /Users/richardalvarez/Dev/flappy-multiplayer/specs/001-establish-a-barebones/spec.md

## Decisions
- Canonical test message: type `test.ping`, payload `{ nonce: string }`.
- Success ack payload: `{ status: "ok", nonce: string, message_id: string }`.
- Error ack payload: `{ status: "error", reason: string, message_id: string }`.
- Connection lifecycle: server keeps connection open; client closes after ack.
- Correlation: server generates `message_id` per inbound message; includes in ack and logs.
- Logging fields: `timestamp`, `session_id`, `direction`, `protocol_version`, `type`, `message_id`.
- Protocol: envelope with `protocol_version`, `type`, `payload` (minimal).

## Rationale
- Simplicity: a single round-trip validates transport, schema validation, and logging without gameplay.
- Deterministic replay: message_id and structured fields ensure correlating request/ack.
- Extensibility: additive schema with minimal envelope allows future message types.

## Alternatives Considered
- Client-provided message_id → declined for now to keep server authoritative.
- Closing connection after ack (server-side) → declined to allow future multi-message flows.
- Embedding correlation id in envelope vs payload → chose payload for ack to keep envelope minimal.

## Open Topics (deferred)
- Timeout threshold for client waiting for ack.
- TLS/WSS usage in non-production environments.
- Performance targets and rate limits (not needed for this step).