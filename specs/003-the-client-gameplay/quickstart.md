# Quickstart: Client Gameplay Loop

This guide verifies the client gameplay loop runs, handles inputs, renders frames, and reconciles to server snapshots.

## Prerequisites
- Node 18+
- Workspace bootstrap complete

## Steps

1) Start dev servers
- Root: `npm run dev` (runs backend and frontend concurrently)
- Wait for frontend at http://localhost:3000

2) Open Game page
- Load the main page (Next.js default route)
- Observe connection status overlay (top-left): should move from Connecting → Open

3) Start a run
- Press Space (or click/tap) to flap once (Start button is disabled until connection is open)
- Expect: local bird becomes active; snapshots begin moving scene

4) Network behavior
- Briefly throttle network in DevTools
- Expect: local prediction continues ≤150 ms and then pauses; on snapshot, reconciliation occurs; if divergence >10 px, immediate snap

5) Engrave flow
- Purposely collide to end run
- Enter a printable ASCII name ≤24 chars; click Save
- Expect: Save disabled while pending; after ack, UI returns to pre-run with leaderboard updated

6) Resize window
- Resize above 1024×768; expect logical 288×512 scaled with preserved aspect ratio (letterbox as needed)

7) Accessibility notes
- Connection state and game mode labels use role="status" with aria-live="polite"
- Engrave form elements have labels; Save is disabled when invalid or pending

## Troubleshooting
- If canvas is blank: check console for errors; ensure 2D context created and animation loop active.
- If inputs don’t send: verify WebSocket open and seq strictly increases; check console logs for dropped events.
- If reconciliation is jittery: confirm delta clamp (50 ms) and prediction cap (150 ms) are enforced.
