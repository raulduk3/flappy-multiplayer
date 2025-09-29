# flappy-multiplayer Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-25

## Active Technologies

- Node.js ≥20 + WebSocket transport, JSON Schema validation, UUID, structured logging (001-establish-a-barebones)
- Node.js ≥20, TypeScript (ESM) + ws (WebSocket), ajv (JSON Schema), uuid, pino, vitest, tsx; Next.js (barebones client) (002-implement-the-minimal)
- N/A (in-memory for this feature) (002-implement-the-minimal)

## Project Structure

```
src/
tests/
```

## Commands

# Add commands for Node.js >=20 (observed local: v24.6.0)

## Code Style

Node.js >=20 (observed local: v24.6.0): Follow standard conventions

## Recent Changes

- 002-implement-the-minimal: Added Node.js ≥20, TypeScript (ESM) + ws (WebSocket), ajv (JSON Schema), uuid, pino, vitest, tsx; Next.js (barebones client)
- 001-establish-a-barebones: Added Node.js ≥20 + WebSocket transport, JSON Schema validation, UUID, structured logging
- 001-establish-the-communication: Added Node.js >=20 (observed local: v24.6.0) + WebSocket server (ws), JSON Schema validator (ajv), uuid, structured logging (pino)

<!-- MANUAL ADDITIONS START -->
- 003-extend-the-game: Client overlay now derives from live active participants (score desc, distance tie-break). Logging enriched with color on join and leaderboard top entry fields for analytics.
<!-- MANUAL ADDITIONS END -->
