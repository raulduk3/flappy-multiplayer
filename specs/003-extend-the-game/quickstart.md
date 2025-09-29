# Quickstart (003-extend-the-game)

## Goal
Validate join → idle spectate → runStart → runEnd → leaderboard update with a fake client and the barebones UI.

## Steps
1. Start server and client (dev).
2. Fake client: send join with color `#33CC99`; ensure join.ack contains `room_id` and `color`.
3. While idle: receive snapshots that include other active players (status=active) and self as idle.
4. Start run: send first flap; observe snapshots reflect status=active for self.
5. Force collision: observe runEnd and a leaderboardUpdate event including your result when applicable (top 10).
6. Barebones client: on Join page select color, press Start; on Game page observe spectate state and inline leaderboard.

### Notes (Client overlay)
- The inline leaderboard overlay shows only currently active runners and is computed live from snapshots, with ties broken by distance; colors come from players when available.

## Notes
- Leaderboard is in-memory; restarting server clears entries.
- Tie-break: earlier end time ranks higher.
