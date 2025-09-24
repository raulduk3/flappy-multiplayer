# Research (Phase 0)

## Decisions

- Timestamp format: Unix epoch milliseconds (number, UTC)
- pipes_window schema: compact arrays `{x:number[], gapY:number[], gapH:number[], id:string[]}`
- PlayerState.state enum: `idle | alive | dead`
- leaderboard_topN entry: `{player_id, name, score, rank, at}` with `at = server_tick`
- Handshake: client `hello` → server `welcome` (or `error`)

## Rationale

- Epoch ms avoids parsing overhead and supports precise ordering.
- Compact arrays minimize payload size at 60 Hz while keeping indices aligned.
- Minimal state enum supports deterministic transitions and simpler clients.
- Including `rank` and `at` in entries makes rendering and snapshot auditing straightforward.
- Explicit handshake enables early protocol validation and clean error semantics.

## Alternatives Considered

- ISO 8601 timestamps: human-readable but larger and costlier to parse.
- Object-per-pipe schema: clearer but heavier; arrays preferred for bandwidth.
- Richer PlayerState: more states increase complexity without clear gameplay value.
- No handshake: would rely on first message; explicit handshake chosen for clarity and security.

## Finalized Decisions

- **Leaderboard tie-breaking**: When scores are equal, rank by score descending, then by earliest achievement time (server-tracked), then by player_id lexicographically for stable ordering. Use dense ranking (scores [100, 100, 90] → ranks [1, 1, 2]).
- **Name policy**: Length ≤ 24 characters. Allowed charset: a-z, A-Z, 0-9, Unicode emojis, basic Unicode letters. Reject names containing profanity (basic filter: server maintains blocklist of common terms). Empty or whitespace-only names rejected.
- **Rate limiting**: Maximum 10 inputs/second per client connection. Burst allowance of 3 additional inputs. Violations trigger `rate_limit_exceeded` error and temporary connection throttling.

**Status**: All critical clarifications resolved; ready for implementation.
