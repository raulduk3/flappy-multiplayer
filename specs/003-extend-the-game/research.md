# Research (003-extend-the-game)

## Decisions (from Clarifications)
- Leaderboard tie-break: earlier end timestamp ranks higher
- Color uniqueness: duplicates allowed within a room
- Room assignment/capacity: fill-first, capacity 32, auto-create when full
- Leaderboard retention: in-memory only; resets on restart
- Scoring metric: distance traveled
- Disconnect semantics: idle remove; in-run end and record
- Snapshot contents: include idle and active with status

## Rationale
- Simplicity and deterministic behavior favored for initial implementation.
- In-memory leaderboards avoid persistence complexity for now.
- Spectate visibility prioritized to always include actives.

## Alternatives considered
- Persisted leaderboards → deferred; adds infra complexity.
- Unique colors per room → deferred; complicates UX and collisions not critical.
- Different tie-breaks (duration, insertion order) → earlier end is intuitive and stable.
