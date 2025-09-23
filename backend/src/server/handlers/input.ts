// T025: Input handler with per-connection sequence dedupe
import {ERRORS} from '../../ws/errors.js';
import {log} from '../../ws/log.js';

export interface InputMessage {
  type: 'input';
  protocol_version: string;
  seq: number;
  action: 'flap' | 'start' | 'join';
  ts: number;
}

export interface InputState {
  lastSeq: number;
  pending: InputMessage[];
}

export function createInputState(): InputState {
  return {lastSeq: -1, pending: []};
}

export function handleInput(msg: InputMessage, state: InputState, sendError: (err: any) => void) {
  if (msg.seq <= state.lastSeq) {
    log.debug('input_dropped_dedupe', {seq: msg.seq, lastSeq: state.lastSeq});
    return;
  }
  // Basic rate limiting placeholder (detailed logic later T026/T027 if needed)
  state.lastSeq = msg.seq;
  state.pending.push(msg);
  log.debug('input_enqueued', {seq: msg.seq});
}