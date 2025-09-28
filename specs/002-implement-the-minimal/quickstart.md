# Quickstart — Minimal Playable Gameplay Loop

This doc explains how to run the server and the barebones client for this feature.

## Prereqs

- Node.js ≥ 20 installed
- Dependencies installed (repo root): npm ci

## Run the server

- Development: npm run dev (uses tsx, picks PORT=3000 unless set)
- Alternate port: set PORT (e.g., PORT=0 for ephemeral)

Notes:
- In development, the client connects via ws://localhost:3000.
- In production, terminate TLS at a proxy and use wss:// to the public endpoint.

## Run the client (barebones)

- Next.js app is in `src/client`.
- Development: npm run client:dev (opens on http://localhost:3001 by default)

## Test matrix

- Contract tests validate protocol messages
- Unit tests cover physics math, collisions, seeded track determinism, run_id uniqueness
- Integration tests cover join→runStart→flap→runEnd→restart
- Property tests ensure server/client produce identical track from seed

## Notes

- Snapshots: 45 Hz; physics: 60 Hz
- Rooms: 32 players max; spillover creates a new room
- Inputs: 5 flaps/sec limit; excess ignored
- Runs start on first flap; new run_id after runEnd

## Troubleshooting

- If tests fail with "Unknown command: tests", use the provided script: npm run test
- If you don’t see snapshots, ensure the server port matches the client WebSocket URL.
- For flaky timing tests on slower machines, close other heavy apps; snapshot cadence has tolerance but needs roughly 45 Hz.
