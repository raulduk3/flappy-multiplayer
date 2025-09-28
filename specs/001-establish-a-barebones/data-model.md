# Data Model — Barebones communication system

## Entities

### Protocol Envelope
- protocol_version: string (e.g., "1.0")
- type: string (e.g., "test.ping", "ack.success", "ack.error")
- payload: object (type-dependent)

### Test Ping (request payload)
- nonce: string

### Ack Success (payload)
- status: string = "ok"
- nonce: string (echo of request)
- message_id: string (server-generated)

### Ack Error (payload)
- status: string = "error"
- reason: string (concise, user-readable)
- message_id: string (server-generated)

### Log Entry
- timestamp: ISO-8601 string
- session_id: string (connection-level stable id)
- direction: string ("inbound" | "outbound")
- protocol_version: string
- type: string
- message_id: string

## Relationships & Constraints
- Each inbound Test Ping yields exactly one outbound Ack (success or error) with the same message_id.
- Server generates message_id for inbound messages.
- Client is responsible for closing connection after receiving ack; server keeps connection open by default.

## Validation Rules
- Envelope MUST include protocol_version, type, and payload.
- test.ping.payload MUST include nonce:string.
- ack.success.payload MUST include status:"ok", nonce:string, message_id:string.
- ack.error.payload MUST include status:"error", reason:string, message_id:string.