# Data Model — Minimal Playable Gameplay Loop

Entities reflect server-authoritative state and protocol message needs.

## Room

- id: string (uuid)
- seed: string (deterministic track seed)
- tick: number (monotonic, 60 Hz)
- capacity: number (32)
- players: Set<PlayerSession.id>

## PlayerSession

- id: string (session_id)
- room_id: string (Room.id)
- status: enum [connected, disconnected]
- active_run_id: string | null

## Run

- id: string (run_id)
- player_id: string (PlayerSession.id)
- room_id: string (Room.id)
- start_tick: number
- end_tick: number | null
- final_distance: number | null
- final_score: number | null
- status: enum [active, ended]

## Snapshot

- room_id: string
- tick: number
- seed: string
- players: Array<ActivePlayerState>

## ActivePlayerState

- player_id: string
- run_id: string
- position: { x: number, y: number }
- velocity: { x: number, y: number }
- status: enum [alive]
- distance: number
- score: number

## TrackConfig

- seed: string
- gap_initial_ratio: number (0.45)
- gap_tighten_per_10s: number (0.01)
- gap_min_ratio: number (0.30)
- spacing_seconds: number (1.5)

## PhysicsConstants

- gravity: number (tbd in implementation, e.g., 200 px/s^2)
- flap_impulse: number (tbd, e.g., -300 px/s)
- forward_velocity: number (tbd, e.g., 120 px/s)
- hitbox: { width: number, height: number } (tbd)

## InputEvent

- type: "flap"
- player_id: string
- run_id: string
- tick: number (server-applied)
- timestamp: number (ms)

Relationships:

- Room has many PlayerSessions and Runs.
- PlayerSession has at most one active Run.
- Snapshot summarizes current active states per Room.
