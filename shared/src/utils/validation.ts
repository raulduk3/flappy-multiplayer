/**
 * Validation utilities for message processing
 */

import { Message, MessageType, InputType, ErrorCode } from '../types/messages';
import { 
  MESSAGE_TYPES, 
  INPUT_TYPES, 
  ERROR_CODES,
  MESSAGE_LIMITS,
  GAME_LIMITS
} from '../protocol/constants';

/**
 * Validates a message object against expected structure
 */
export function validateMessage(message: any): message is Message {
  if (!message || typeof message !== 'object') {
    return false;
  }

  if (!message.type || typeof message.type !== 'string') {
    return false;
  }

  if (!message.protocol_version || typeof message.protocol_version !== 'string') {
    return false;
  }

  // Validate protocol version format (semantic versioning)
  const versionPattern = /^\d+\.\d+\.\d+$/;
  if (!versionPattern.test(message.protocol_version)) {
    return false;
  }

  // Validate message type
  const validMessageTypes = Object.values(MESSAGE_TYPES);
  if (!validMessageTypes.includes(message.type as MessageType)) {
    return false;
  }

  // Type-specific validations
  switch (message.type) {
    case MESSAGE_TYPES.INPUT:
      return validateInputMessage(message);
    case MESSAGE_TYPES.HELLO:
      return validateHelloMessage(message);
    case MESSAGE_TYPES.WELCOME:
      return validateWelcomeMessage(message);
    case MESSAGE_TYPES.ERROR:
      return validateErrorMessage(message);
    case MESSAGE_TYPES.CAPABILITIES_REQUEST:
      return validateCapabilitiesRequestMessage(message);
    case MESSAGE_TYPES.CAPABILITIES_RESPONSE:
      return validateCapabilitiesResponseMessage(message);
    default:
      return true; // Basic validation passed for other types
  }
}

function validateInputMessage(message: any): boolean {
  return (
    typeof message.sequence_number === 'number' &&
    message.sequence_number >= MESSAGE_LIMITS.MIN_SEQUENCE_NUMBER &&
    message.sequence_number <= MESSAGE_LIMITS.MAX_SEQUENCE_NUMBER &&
    typeof message.input_type === 'string' &&
    Object.values(INPUT_TYPES).includes(message.input_type as InputType) &&
    typeof message.timestamp === 'number' &&
    message.timestamp >= 0 &&
    (message.duration === undefined || (typeof message.duration === 'number' && message.duration >= 0))
  );
}

function validateHelloMessage(message: any): boolean {
  return Object.keys(message).length === 2; // Only type and protocol_version
}

function validateWelcomeMessage(message: any): boolean {
  return (
    typeof message.session_id === 'string' &&
    message.session_id.length > 0 &&
    /^session_[a-zA-Z0-9]{8,16}$/.test(message.session_id) &&
    typeof message.server_time === 'number' &&
    message.server_time >= 0
  );
}

function validateErrorMessage(message: any): boolean {
  return (
    typeof message.error_code === 'string' &&
    Object.values(ERROR_CODES).includes(message.error_code as ErrorCode) &&
    typeof message.message === 'string' &&
    message.message.length > 0
  );
}

function validateCapabilitiesRequestMessage(message: any): boolean {
  return Object.keys(message).length === 2; // Only type and protocol_version
}

function validateCapabilitiesResponseMessage(message: any): boolean {
  return (
    message.capabilities &&
    typeof message.capabilities === 'object' &&
    typeof message.capabilities.max_players === 'number' &&
    message.capabilities.max_players >= GAME_LIMITS.MIN_PLAYERS &&
    message.capabilities.max_players <= GAME_LIMITS.MAX_PLAYERS &&
    Array.isArray(message.capabilities.supported_input_types) &&
    message.capabilities.supported_input_types.length > 0 &&
    message.capabilities.supported_input_types.every((type: any) => 
      typeof type === 'string' && Object.values(INPUT_TYPES).includes(type as InputType)
    )
  );
}

/**
 * Validates that a sequence number is valid
 */
export function isValidSequenceNumber(sequenceNumber: any): boolean {
  return (
    typeof sequenceNumber === 'number' &&
    Number.isInteger(sequenceNumber) &&
    sequenceNumber >= MESSAGE_LIMITS.MIN_SEQUENCE_NUMBER &&
    sequenceNumber <= MESSAGE_LIMITS.MAX_SEQUENCE_NUMBER &&
    Number.isSafeInteger(sequenceNumber)
  );
}

/**
 * Validates player nickname format
 */
export function isValidNickname(nickname: any): boolean {
  return (
    typeof nickname === 'string' &&
    nickname.length >= GAME_LIMITS.MIN_NICKNAME_LENGTH &&
    nickname.length <= GAME_LIMITS.MAX_NICKNAME_LENGTH &&
    /^[a-zA-Z0-9_-]+$/.test(nickname)
  );
}