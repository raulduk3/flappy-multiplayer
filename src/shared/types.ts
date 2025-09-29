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
  // Additional optional fields for richer analytics
  color?: string; // player color on join
  player_id?: string; // player involved (e.g., leaderboard update)
  score?: number; // score at event time (e.g., leaderboard update)
  ended_at?: number; // ms epoch when run ended (e.g., leaderboard update)
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
  // Additive: player color when available (server includes when set)
  color?: string; // #RRGGBB
}

export interface SnapshotPayload {
  room_id: string;
  tick: number;
  seed: string;
  players: ActivePlayerState[];
  // Additive: full list of room participants (idle + active)
  participants?: Participant[];
}

export interface RunEndPayload {
  room_id: string;
  run_id: string;
  final_distance: number;
  final_score: number;
  reason: string;
}

// New additive shared types (003-extend-the-game)
export type ParticipantStatus = "idle" | "active";

export interface Participant {
  player_id: string;
  status: ParticipantStatus;
  color: string; // #RRGGBB
  position?: Vec2; // present when status=active
  velocity?: Vec2; // present when status=active
  distance?: number; // present when status=active
}

export interface LeaderboardEntry {
  player_id: string;
  color: string; // #RRGGBB
  score: number; // distance
  ended_at: number; // ms epoch
}

// Additive: Leaderboard update payload (003-extend-the-game)
export interface LeaderboardUpdatePayload {
  room_id: string;
  entries: LeaderboardEntry[];
}
