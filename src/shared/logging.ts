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
    },
  };
}

export function buildLogEntry(params: {
  session_id: string;
  direction: Direction;
  protocol_version: string;
  type: string;
  message_id: string;
  // Optional replay fields
  room_id?: string;
  run_id?: string;
  seed?: string;
  tick?: number;
  final_distance?: number;
  final_score?: number;
}): LogEntry {
  const base: LogEntry = {
    timestamp: new Date().toISOString(),
    session_id: params.session_id,
    direction: params.direction,
    protocol_version: params.protocol_version,
    type: params.type,
    message_id: params.message_id,
  };
  const extra: Partial<LogEntry> = {};
  if (params.room_id !== undefined) extra.room_id = params.room_id;
  if (params.run_id !== undefined) extra.run_id = params.run_id;
  if (params.seed !== undefined) extra.seed = params.seed;
  if (params.tick !== undefined) extra.tick = params.tick;
  if (params.final_distance !== undefined)
    extra.final_distance = params.final_distance;
  if (params.final_score !== undefined) extra.final_score = params.final_score;
  return { ...base, ...extra };
}
