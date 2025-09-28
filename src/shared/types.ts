export interface Envelope<T = unknown> {
  protocol_version: string; // e.g., "1.0"
  type: string; // e.g., "test.ping"
  payload: T;
}

export interface TestPingPayload {
  nonce: string;
}

export interface AckSuccessPayload {
  status: "ok";
  nonce: string;
  message_id: string;
}

export interface AckErrorPayload {
  status: "error";
  reason: string;
  message_id: string;
}

export type Direction = "inbound" | "outbound";

export interface LogEntry {
  timestamp: string; // ISO-8601
  session_id: string;
  direction: Direction;
  protocol_version: string;
  type: string;
  message_id: string;
}
