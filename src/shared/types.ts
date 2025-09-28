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
  // Optional replay fields for richer logs (present when applicable)
  room_id?: string;
  run_id?: string;
  seed?: string;
  tick?: number;
  final_distance?: number;
  final_score?: number;
}

// Game-specific shared types
export interface Vec2 {
  x: number;
  y: number;
}

export type PlayerStatus = "alive" | "ended";

export interface ActivePlayerState {
  player_id: string;
  run_id: string;
  position: Vec2;
  velocity: Vec2;
  status: "alive";
  distance: number;
  score: number;
}

export interface SnapshotPayload {
  room_id: string;
  tick: number;
  seed: string;
  players: ActivePlayerState[];
}

export interface RunEndPayload {
  room_id: string;
  run_id: string;
  final_distance: number;
  final_score: number;
  reason: string;
}
