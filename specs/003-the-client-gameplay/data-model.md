# Data Model: Client Gameplay

Date: 2025-09-24
Branch: 003-the-client-gameplay
Spec: ./spec.md

## Entities

- LocalSession
  - state: "pre-run" | "run" | "engrave"
  - lastServerTick: number
  - lastAuthoritative: { x: number; y: number; vx: number; vy: number; atTick: number }
  - lastPredictStartMs: number | null
  - lastSeqSent: number
  - runId?: string
  - connection: "connecting" | "connected" | "reconnecting" | "error"

- InputEvent
  - seq: number
  - action: "flap"
  - ts: number (client ms)

- SnapshotView (authoritative)
  - server_tick: number
  - players: Array<{ id: string; x: number; y: number; vx: number; vy: number; state: "idle" | "alive" | "dead" }>
  - pipes_window: { x: number[]; gapY: number[]; gapH: number[]; id: string[] }
  - leaderboard_topN: Array<{ player_id: string; name: string; score: number; rank: number; at: number }>

- LeaderboardModel
  - entries: same as leaderboard_topN
  - sort: score DESC, elapsed_ms ASC, run_id lexical (from server; client mirrors order)

- RenderModel
  - logical: { width: 288, height: 512 }
  - viewport: { width: number, height: number }
  - scale: number
  - toScreen(p: {x:number;y:number}): {x:number;y:number}

## State Transitions

- pre-run → run: upon first flap with open connection and runStart/welcome preconditions satisfied
- run → engrave: upon authoritative runEnd for local run_id
- engrave → pre-run: after successful engraving (or user cancels if provided)

## Validation Rules

- Inputs must have seq > lastSeqSent; duplicates ignored.
- Snapshots with server_tick <= lastServerTick ignored.
- Engrave name 1..24 printable ASCII; invalid blocks Save.
- Prediction limited to 150 ms since lastAuthoritative; clamp frame dt to 50 ms on resume.

