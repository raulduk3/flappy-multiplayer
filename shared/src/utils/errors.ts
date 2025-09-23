/**
 * Error formatting and message creation utilities
 */

import { ErrorMessage, ErrorCode } from '../types/messages';
import { ERROR_CODES, PROTOCOL_VERSION } from '../protocol/constants';

/**
 * Formats an error message with consistent structure
 */
export function formatError(
  errorCode: ErrorCode,
  message: string,
  protocolVersion: string = PROTOCOL_VERSION
): ErrorMessage {
  return {
    type: 'error',
    protocol_version: protocolVersion,
    error_code: errorCode as any, // Type assertion needed due to const assertion mismatch
    message: message.trim()
  };
}

/**
 * Creates standard error messages for common scenarios
 */
export const createErrorMessage = {
  malformedMessage: (details?: string): ErrorMessage => 
    formatError(
      ERROR_CODES.MALFORMED_MESSAGE,
      details ? `Message could not be parsed: ${details}` : 'Message could not be parsed'
    ),
    
  unknownMessageType: (type: string): ErrorMessage =>
    formatError(
      ERROR_CODES.UNKNOWN_MESSAGE_TYPE,
      `Message type '${type}' is not supported`
    ),
    
  unsupportedProtocolVersion: (version: string): ErrorMessage =>
    formatError(
      ERROR_CODES.UNSUPPORTED_PROTOCOL_VERSION,
      `Protocol version '${version}' is not supported. Server supports: ${PROTOCOL_VERSION}`
    ),
    
  invalidSequenceNumber: (sequenceNumber: any, reason?: string): ErrorMessage =>
    formatError(
      ERROR_CODES.INVALID_SEQUENCE_NUMBER,
      reason ? 
        `Invalid sequence number ${sequenceNumber}: ${reason}` :
        `Invalid sequence number: ${sequenceNumber}`
    ),
    
  rateLimitExceeded: (limit?: number): ErrorMessage =>
    formatError(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      limit ?
        `Rate limit exceeded. Maximum ${limit} messages per second` :
        'Rate limit exceeded. Please slow down'
    )
};

/**
 * Validates error code is a known value
 */
export function isValidErrorCode(code: any): code is ErrorCode {
  return typeof code === 'string' && 
         Object.values(ERROR_CODES).includes(code as ErrorCode);
}

/**
 * Gets human-readable description for error codes
 */
export function getErrorDescription(errorCode: ErrorCode): string {
  switch (errorCode) {
    case ERROR_CODES.MALFORMED_MESSAGE:
      return 'The message format is invalid or corrupted';
    case ERROR_CODES.UNKNOWN_MESSAGE_TYPE:
      return 'The message type is not recognized';
    case ERROR_CODES.UNSUPPORTED_PROTOCOL_VERSION:
      return 'The protocol version is not supported by the server';
    case ERROR_CODES.INVALID_SEQUENCE_NUMBER:
      return 'The sequence number is invalid or out of order';
    case ERROR_CODES.RATE_LIMIT_EXCEEDED:
      return 'Too many messages sent too quickly';
    default:
      return 'An unknown error occurred';
  }
}