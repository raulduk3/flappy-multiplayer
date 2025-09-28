# flappy-multiplayer

Minimal multiplayer Flappy-style game with a deterministic server-authoritative loop.

## Run

- Install deps: npm ci
- Dev server: npm run dev (defaults to PORT=3000)
- Dev client: npm run client:dev (opens Next.js app)

Client WebSocket URL defaults to `ws://localhost:3000` and can be overridden via `NEXT_PUBLIC_WS_URL`.

## Controls

- Spacebar or mouse/tap to flap
- A new run starts on the first flap; after a collision, flap again to start a new run.

## Notes

- Snapshots ~45 Hz, physics 60 Hz; deterministic track from room seed.
- Rate limit: max 5 flaps/sec; excess inputs ignored.

See `specs/002-implement-the-minimal/quickstart.md` for more details.
