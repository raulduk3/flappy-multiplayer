# Quickstart (Phase 1)

## Handshake

1. Client connects via ws.
2. Send `hello`:
   ```json
   {
     "type": "hello",
     "protocol_version": "1.0.0",
     "client_info": { "client": "web", "version": "dev" }
   }
   ```
3. Receive `welcome` or `error`.

## Sending Input

- Example flap:
  ```json
  {
    "type": "input",
    "protocol_version": "1.0.0",
    "seq": 1,
    "action": "flap",
    "ts": 1695484800000
  }
  ```
- Sequence numbers MUST increase per client session.

## Engraving Name

```json
{
  "type": "engrave",
  "protocol_version": "1.0.0",
  "run_id": "r1",
  "name": "PlayerOne"
}
```

## Processing Broadcasts

- Snapshots are ordered by `server_tick`; ignore stale ones.
- Example snapshot (truncated):

```json
{
  "type": "snapshot",
  "protocol_version": "1.0.0",
  "server_tick": 1200,
  "players": [
    { "id": "p1", "x": 10, "y": 200, "vx": 0, "vy": -2, "state": "alive" }
  ],
  "pipes_window": {
    "x": [300, 550],
    "gapY": [220, 230],
    "gapH": [120, 120],
    "id": ["a", "b"]
  },
  "leaderboard_topN": [
    {
      "player_id": "p1",
      "name": "PlayerOne",
      "score": 12,
      "rank": 1,
      "at": 1200
    }
  ]
}
```

## Run Lifecycle

- runStart: initialize with `run_id`, `room_id`, `player_id`, `start_time`.
- runEnd: finalize with `end_time`, `score`, `cause`.

## Errors

- On validation failure, server sends `error` with `code`, `message`, optional `details`.

## Capabilities Discovery (FR-023)

After receiving `welcome`, the client SHOULD send a capabilities request (the provided `ProtocolClient` does this automatically):

Request:

```json
{ "type": "capabilities_request", "protocol_version": "1.0.0" }
```

Response:

```json
{
  "type": "capabilities_response",
  "protocol_version": "1.0.0",
  "supported_features": ["snapshot", "runStart", "runEnd", "capabilities"]
}
```

Clients can use this list to conditionally enable UI panels or gameplay features. Unknown features MUST be ignored for forward compatibility.
