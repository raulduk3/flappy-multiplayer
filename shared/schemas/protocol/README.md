# Protocol Schemas

This directory contains versioned JSON Schemas for the real-time multiplayer protocol.

## Versioning

- Semantic Versioning (SemVer) is used: MAJOR.MINOR.PATCH
- MAJOR: Breaking schema changes (remove field, change type, rename)
- MINOR: Backward-compatible additions (new optional field, new message type, new enum value with safe default)
- PATCH: Clarifications, description updates, tighter (but still backward-compatible) constraints

## Layout

```
protocol/
  README.md
  v1/
    envelope.schema.json            # Union of all message types for protocol_version MAJOR=1
    capabilities-request.schema.json
    capabilities-response.schema.json
    player-state.schema.json
    pipes-window.schema.json
    leaderboard-entry.schema.json
    snapshot.schema.json
    runstart.schema.json
    runend.schema.json
    input.schema.json
    engrave.schema.json
    error.schema.json
    hello.schema.json
    welcome.schema.json
```

## Authoring Rules

1. Each schema must include `$id` and `$schema` (draft-07).
2. All message schemas must include `protocol_version` with a pattern `^1\.\d+\.\d+$` for MAJOR 1.
3. Descriptions must clarify semantics, not implementation details.
4. New enum values MUST be additive and documented in spec.md before implementation.
5. Avoid `additionalProperties: true` unless explicitly required for forward compatibility.

## Capabilities (FR-023)

The capabilities request/response pair enables runtime discovery of supported features within the same MAJOR version.

## Validation

Schemas are compiled once at server start (Ajv strict mode) and reused for each message.
