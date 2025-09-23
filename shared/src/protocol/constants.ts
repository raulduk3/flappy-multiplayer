/**
 * Protocol constants for Flappy Multiplayer WebSocket communication
 * Version: 1.0.0
 */

export const PROTOCOL_VERSION = '1.0.0';

export const GAME_LIMITS = {
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 1,
  MAX_NICKNAME_LENGTH: 32,
  MIN_NICKNAME_LENGTH: 1,
} as const;

export const MESSAGE_LIMITS = {
  MAX_MESSAGE_SIZE: 1024,
  MAX_SEQUENCE_NUMBER: Number.MAX_SAFE_INTEGER,
  MIN_SEQUENCE_NUMBER: 1,
} as const;

export const TIMING_CONSTANTS = {
  HEARTBEAT_INTERVAL: 30000,           // 30 seconds
  CONNECTION_TIMEOUT: 60000,           // 60 seconds
  HANDSHAKE_TIMEOUT: 30000,            // 30 seconds to complete handshake
  IDLE_TIMEOUT: 300000,                // 5 minutes of inactivity
  GAME_TIMEOUT: 600000,                // 10 minutes maximum game duration
  PONG_TIMEOUT: 10000,                 // 10 seconds to respond to ping
} as const;

export const RATE_LIMITING = {
  MAX_INPUTS_PER_SECOND: 30,
  MAX_MESSAGES_PER_SECOND: 50,
  BURST_LIMIT: 10,
  PENALTY_DURATION: 5000,              // 5 seconds
  RATE_LIMIT_WINDOW: 1000,             // 1 second window
} as const;

export const CONNECTION_LIMITS = {
  MAX_CONCURRENT_CONNECTIONS: 100,
  MAX_CONNECTIONS_PER_IP: 5,
  MAX_PLAYERS_PER_GAME: 4,
} as const;

export const MESSAGE_TYPES = {
  HELLO: 'hello',
  WELCOME: 'welcome', 
  ERROR: 'error',
  INPUT: 'input',
  ENGRAVE: 'engrave',
  SNAPSHOT: 'snapshot',
  RUN_START: 'runStart',
  RUN_END: 'runEnd',
  CAPABILITIES_REQUEST: 'capabilities_request',
  CAPABILITIES_RESPONSE: 'capabilities_response',
} as const;

export const INPUT_TYPES = {
  TAP: 'tap',
  HOLD: 'hold',
} as const;

export const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  HANDSHAKING: 'handshaking',
  AUTHENTICATED: 'authenticated', 
  ACTIVE: 'active',
  DISCONNECTING: 'disconnecting',
  DISCONNECTED: 'disconnected',
} as const;

export const GAME_PHASES = {
  WAITING_FOR_PLAYERS: 'waiting_for_players',
  GAME_ACTIVE: 'game_active',
  GAME_PAUSED: 'game_paused',
  GAME_ENDED: 'game_ended',
} as const;

export const ERROR_CODES = {
  MALFORMED_MESSAGE: 'malformed_message',
  UNKNOWN_MESSAGE_TYPE: 'unknown_message_type',
  UNSUPPORTED_PROTOCOL_VERSION: 'unsupported_protocol_version',
  INVALID_SEQUENCE_NUMBER: 'invalid_sequence_number',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
} as const;

export const CAPABILITIES = {
  FEATURES: {
    SPECTATOR_MODE: 'spectator_mode',
    REPLAY_SYSTEM: 'replay_system',
    CUSTOM_GAME_MODES: 'custom_game_modes',
  },
  PROTOCOL_FEATURES: {
    INPUT_SEQUENCING: 'input_sequencing',
    ERROR_RECOVERY: 'error_recovery', 
    CAPABILITIES_DISCOVERY: 'capabilities_discovery',
  },
} as const;

export const GAME_CONFIG = {
  BIRD_COLORS: ['red', 'blue', 'green', 'yellow'] as const,
  OBSTACLE_TYPES: ['pipe', 'wall', 'moving_pipe'] as const,
  DEFAULT_GAP_HEIGHT: 120,
  MIN_GAP_HEIGHT: 50,
  MAX_GAP_HEIGHT: 200,
  DEFAULT_OBSTACLE_WIDTH: 60,
  MIN_OBSTACLE_WIDTH: 20,
  MAX_OBSTACLE_WIDTH: 100,
} as const;