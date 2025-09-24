# Data Model (Phase 1)

## Message Envelope

- `protocol_version: string`
- `type: string` (one of `hello`, `welcome`, `error`, `input`, `engrave`, `snapshot`, `runStart`, `runEnd`, `capabilities_request`, `capabilities_response`)

## Client → Server

- Input: `{type:"input", protocol_version, seq:number, action:"flap"|"start"|"join", ts:number}`
- Engrave: `{type:"engrave", protocol_version, run_id:string, name:string}`
- Hello: `{type:"hello", protocol_version:string, client_info?:{client?:string, version?:string}}`
- CapabilitiesRequest: `{type:"capabilities_request", protocol_version:string}`

## Server → Client

- Welcome: `{type:"welcome", protocol_version:string, server_info?:{version?:string}}`
- Error: `{type:"error", protocol_version, code:string, message:string, details?:object, upgrade_hint?:string}`
- Snapshot: `{type:"snapshot", protocol_version, server_tick:number, players:[PlayerState], pipes_window:PipesWindow, leaderboard_topN:[LeaderboardEntry]}`
- RunStart: `{type:"runStart", protocol_version, run_id:string, room_id:string, player_id:string, start_time:number}`
- RunEnd: `{type:"runEnd", protocol_version, run_id:string, end_time:number, score:number, cause:string}`
- CapabilitiesResponse: `{type:"capabilities_response", protocol_version:string, supported_features:[string]}`

## Embedded Types

- PlayerState: `{id:string, x:number, y:number, vx:number, vy:number, state:"idle"|"alive"|"dead"}`
- PipesWindow: `{x:number[], gapY:number[], gapH:number[], id:string[]}` (arrays aligned by index)
- LeaderboardEntry: `{player_id:string, name:string, score:number, rank:number, at:number}` (at = server_tick)

## Identity & Ordering

- Inputs keyed by `(player_id, seq)`; seq is monotonically increasing per connection.
- Broadcasts ordered by `server_tick`; clients ignore stale ticks.

## Validation Rules (selected)

- `protocol_version` MUST match server MAJOR; MINOR/PATCH handled per SemVer.
- `name` policy TBD (length ≤ 24, charset, profanity filter) — Allowed charset: a-z, A-Z, 0-9, Unicode emojis, basic Unicode letters. Reject names containing profanity (basic filter: server maintains blocklist of common terms). Empty or whitespace-only names rejected.
- Rate limiting thresholds: Maximum 10 inputs/second per client connection. Burst allowance of 3 additional inputs. Violations trigger `rate_limit_exceeded` error and temporary connection throttling.
