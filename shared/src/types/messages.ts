/**
 * TypeScript interfaces for all WebSocket message types in the Flappy Multiplayer protocol
 * These types correspond to the JSON Schema definitions in shared/schemas/protocol/v1/
 */

import {
  MESSAGE_TYPES,
  INPUT_TYPES,
  CONNECTION_STATES,
  GAME_PHASES,
  ERROR_CODES,
  GAME_CONFIG,
} from '../protocol/constants';

// Base message interface
export interface BaseMessage {
  type: string;
  protocol_version: string;
}

// Handshake messages
export interface HelloMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.HELLO;
}

export interface WelcomeMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.WELCOME;
  session_id: string;
  server_time: number;
}

// Error message
export interface ErrorMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.ERROR;
  error_code: keyof typeof ERROR_CODES;
  message: string;
}

// Input message
export interface InputMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.INPUT;
  sequence_number: number;
  input_type: keyof typeof INPUT_TYPES;
  timestamp: number;
  duration?: number; // Optional for hold inputs
}

// Game state messages
export interface EngraveMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.ENGRAVE;
  sequence_number: number;
  game_state: GameState;
}

export interface SnapshotMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.SNAPSHOT;
  sequence_number: number;
  full_state: GameState;
}

// Game lifecycle messages
export interface RunStartMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.RUN_START;
  run_id: string;
  players: PlayerInfo[];
}

export interface RunEndMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.RUN_END;
  run_id: string;
  final_scores: PlayerScore[];
}

// Capabilities messages (FR-023)
export interface CapabilitiesRequestMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.CAPABILITIES_REQUEST;
}

export interface CapabilitiesResponseMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.CAPABILITIES_RESPONSE;
  capabilities: ServerCapabilities;
}

// Union type for all message types
export type Message = 
  | HelloMessage
  | WelcomeMessage
  | ErrorMessage
  | InputMessage
  | EngraveMessage
  | SnapshotMessage
  | RunStartMessage
  | RunEndMessage
  | CapabilitiesRequestMessage
  | CapabilitiesResponseMessage;

// Entity interfaces corresponding to JSON schemas
export interface Player {
  id: string;
  nickname: string;
  session_id: string;
  is_ready: boolean;
  joined_at: number;
  last_input_sequence?: number;
  connection_state?: keyof typeof CONNECTION_STATES;
}

export interface Bird {
  player_id: string;
  x: number;
  y: number;
  velocity_y: number;
  is_alive: boolean;
  last_jump_time?: number;
  score?: number;
  color?: typeof GAME_CONFIG.BIRD_COLORS[number];
}

export interface Obstacle {
  id: string;
  x: number;
  gap_y: number;
  gap_height: number;
  width: number;
  passed_by?: string[];
  created_at?: number;
  type?: typeof GAME_CONFIG.OBSTACLE_TYPES[number];
}

// Game state interface
export interface GameState {
  phase: keyof typeof GAME_PHASES;
  players: Player[];
  birds: Record<string, Bird>; // player_id -> Bird
  obstacles: Obstacle[];
  score: number;
  game_time: number;
  last_update: number;
  run_id?: string;
}

// Supporting interfaces
export interface PlayerInfo {
  id: string;
  nickname: string;
}

export interface PlayerScore {
  player_id: string;
  score: number;
}

export interface ServerCapabilities {
  max_players: number;
  supported_input_types: (keyof typeof INPUT_TYPES)[];
  features?: string[];
  protocol_features?: string[];
}

// Connection management types
export interface Connection {
  id: string;
  state: keyof typeof CONNECTION_STATES;
  last_activity: number;
  player_id?: string;
  session_id?: string;
  timeouts: {
    handshake?: any; // Timer reference (Node.js or browser compatible)
    idle?: any;
    pong?: any;
  };
}

export interface Session {
  id: string;
  state: 'created' | 'active' | 'expired' | 'terminated';
  created_at: number;
  last_activity: number;
  expires_at: number;
  player_id?: string;
  game_id?: string;
  preferences?: {
    theme: 'light' | 'dark';
    sound_enabled: boolean;
  };
  stats?: {
    games_played: number;
    best_score: number;
    total_play_time: number;
  };
}

// Utility types for type checking
export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
export type InputType = typeof INPUT_TYPES[keyof typeof INPUT_TYPES];
export type ConnectionState = typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];
export type GamePhase = typeof GAME_PHASES[keyof typeof GAME_PHASES];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];