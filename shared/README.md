# Shared Package

This package (`shared/`) contains versioned JSON Schemas and shared TypeScript utilities for the real-time Flappy multiplayer protocol.

## Schema Versioning Strategy

Schemas live under `schemas/protocol/v1/` and follow semantic versioning at the protocol layer:

- `MAJOR`: Breaking changes (message removed, field removed/renamed, incompatible type change)
- `MINOR`: Backwards-compatible additions (new optional fields, new message types advertised via capabilities)
- `PATCH`: Non-functional corrections (typos, stricter validation that does not break valid clients)

The `protocol_version` embedded in every message uses `MAJOR.MINOR.PATCH`. The server currently enforces **MAJOR compatibility**: clients must match the server's MAJOR; MINOR/PATCH differences are tolerated.

## Adding a New Message Type

1. Define the schema file: `schemas/protocol/v1/<new-message>.schema.json`.
2. Update `envelope.schema.json`:
   - Add the new message schema to `oneOf`.
   - List the new string literal in any enumerations of `type`.
3. Add tests:
   - Contract test asserting envelope parity (update sample set).
   - Integration test if runtime behavior is needed.
4. If the feature is optional, expose it through the capabilities response (`supported_features`).
5. Increment protocol MINOR version if the new message is optional/backward-compatible; increment MAJOR if it breaks existing clients.

## Capabilities (FR-023)

The server responds to `capabilities_request` with a `capabilities_response` enumerating feature flags / message categories that clients may conditionally use. This allows forward-compatible rollouts:

- Clients must ignore unknown capabilities.
- New messages should only be sent by clients after confirming support.

## Validation

All schemas are compiled once using Ajv in the backend at startup (`backend/src/ws/validation.ts`). Avoid dynamic schema mutation at runtime—additive changes require a new deploy.

## Error Codes

Defined in `backend/src/ws/errors.ts`. When adding new error codes:

1. Extend the `ErrorCode` union.
2. Provide a factory in `ERRORS` mapping.
3. Add a unit test in `backend/tests/unit/ws-errors.test.ts`.

## Performance Note

Validation performance is sanity-checked in `backend/tests/perf/validation.perf.test.ts`. Maintain <5ms average per message on warm instances. If heavier validation is required, consider pre-normalization or schema splitting.

## Future Improvements

- Generate TypeScript types from schemas automatically.
- Add schema $defs reuse for shared fragments (player state, leaderboard entry).
- Introduce protocol changelog under this directory.
