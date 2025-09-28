import pino, { Logger as PinoLogger } from "pino";
import { LogEntry, Direction } from "./types.js";

export type Logger = PinoLogger;

export function createLogger(): Logger {
  return pino({ level: process.env.LOG_LEVEL || "info" });
}

export function createLogCollector() {
  const entries: LogEntry[] = [];
  return {
    log(entry: LogEntry) {
      entries.push(entry);
    },
    getEntries() {
      return entries.slice();
    }
  };
}

export function buildLogEntry(params: {
  session_id: string;
  direction: Direction;
  protocol_version: string;
  type: string;
  message_id: string;
}): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    session_id: params.session_id,
    direction: params.direction,
    protocol_version: params.protocol_version,
    type: params.type,
    message_id: params.message_id
  };
}
