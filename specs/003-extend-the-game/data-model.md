# Data Model (003-extend-the-game)

## Entities

### Player
- id: string (server-issued)
- color: string (RGB hex `#RRGGBB`, non-unique)
- room_id: string
- state: enum ('idle' | 'active')

### Room
- id: string
- capacity: number (default 32)
- leaderboard: LeaderboardEntry[] (top 10, in-memory)

### Run
- id: string
- player_id: string
- room_id: string
- started_at: number (ms)
- ended_at: number (ms | null)
- distance: number (score)
- status: enum('active'|'ended')

### Snapshot
- room_id: string
- tick: number
- seed: string
- participants: Participant[]

### Participant
- player_id: string
- status: enum('idle'|'active')
- color: string
- position?: { x: number, y: number } // active only
- velocity?: { x: number, y: number } // active only
- distance?: number // active only

### LeaderboardEntry
- player_id: string
- color: string
- score: number (distance)
- ended_at: number (ms)

## Relationships
- Room has many Players and Runs.
- Room has many LeaderboardEntry (top 10) derived from Runs.
- Snapshot summarizes Participants of a Room at a tick.

## Validation Rules
- color: must match `^#([0-9a-fA-F]{6})$`
- room capacity: ≤ 32
- leaderboard sorted by score desc; tie-break: earlier ended_at
