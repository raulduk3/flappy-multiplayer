# Contracts (003-extend-the-game)

Additive protocol changes for v1:
- join.request: add `color` (#RRGGBB)
- join.ack: include `color` and `room_id`
- snapshot.event: include idle and active participants with `status`; include `color`; active entries contain `position`, `velocity`, `distance`
- leaderboardUpdate.event: new event with `room_id` and `entries` (top 10)

Tests in `tests/contract/` will validate JSON schemas in `shared/schemas/protocol/v1`.
