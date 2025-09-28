import { v4 as uuidv4 } from "uuid";

// Simple wrapper for run_id generation using UUID v4
export function newRunId(): string {
  return uuidv4();
}
