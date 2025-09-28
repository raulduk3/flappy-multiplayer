# Quickstart — Minimal Playable Gameplay Loop

This doc explains how to run the server and the barebones client for this feature.

## Prereqs

- Node.js ≥ 20 installed
- Dependencies installed (repo root): npm ci

## Run the server

- Development: npm run dev (uses tsx, picks PORT=3000 unless set)
- Alternate port: PORT=0 for ephemeral

## Run the client (barebones)

- Next.js app in `src/client` (to be scaffolded in implementation)
- Development: npm run client:dev

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
