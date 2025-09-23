/**
 * Session and ID generation utilities
 */

/**
 * Generates a unique session ID with the format: session_{random_string}
 */
export function generateSessionId(): string {
  const randomString = generateRandomString(12);
  return `session_${randomString}`;
}

/**
 * Generates a unique player ID with the format: player_{random_string}
 */
export function generatePlayerId(): string {
  const randomString = generateRandomString(12);
  return `player_${randomString}`;
}

/**
 * Generates a unique obstacle ID with the format: obstacle_{random_string}
 */
export function generateObstacleId(): string {
  const randomString = generateRandomString(12);
  return `obstacle_${randomString}`;
}

/**
 * Generates a unique run ID with the format: run_{timestamp}_{random_string}
 */
export function generateRunId(): string {
  const timestamp = Date.now();
  const randomString = generateRandomString(8);
  return `run_${timestamp}_${randomString}`;
}

/**
 * Generates a cryptographically secure random string
 */
function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Use crypto.getRandomValues if available (browser), otherwise use Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for Node.js environments
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Validates ID format patterns
 */
export function isValidSessionId(sessionId: string): boolean {
  return /^session_[a-zA-Z0-9]{8,16}$/.test(sessionId);
}

export function isValidPlayerId(playerId: string): boolean {
  return /^player_[a-zA-Z0-9]{8,16}$/.test(playerId);
}

export function isValidObstacleId(obstacleId: string): boolean {
  return /^obstacle_[a-zA-Z0-9]{8,16}$/.test(obstacleId);
}

export function isValidRunId(runId: string): boolean {
  return /^run_\d+_[a-zA-Z0-9]{8}$/.test(runId);
}