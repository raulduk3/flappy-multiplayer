/**
 * Timestamp and time-related utilities
 */

/**
 * Creates a timestamp in milliseconds since epoch
 */
export function createTimestamp(): number {
  return Date.now();
}

/**
 * Validates that a timestamp is reasonable (not too far in past/future)
 */
export function isValidTimestamp(timestamp: number): boolean {
  if (typeof timestamp !== 'number' || timestamp < 0) {
    return false;
  }
  
  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;
  
  // Allow timestamps from 1 hour ago to 1 hour in future
  // This accounts for clock skew between client and server
  return timestamp >= (now - oneHourMs) && timestamp <= (now + oneHourMs);
}

/**
 * Calculates time difference between two timestamps
 */
export function timeDifference(timestamp1: number, timestamp2: number): number {
  return Math.abs(timestamp1 - timestamp2);
}

/**
 * Formats a timestamp for logging/debugging
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Calculates elapsed time since a given timestamp
 */
export function elapsedTime(since: number): number {
  return Date.now() - since;
}

/**
 * Checks if a timestamp is expired based on a timeout duration
 */
export function isExpired(timestamp: number, timeoutMs: number): boolean {
  return elapsedTime(timestamp) > timeoutMs;
}

/**
 * Creates a future timestamp by adding duration to current time
 */
export function futureTimestamp(durationMs: number): number {
  return Date.now() + durationMs;
}