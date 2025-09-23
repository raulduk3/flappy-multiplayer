// T027: Run lifecycle handler
import crypto from 'crypto';

export interface RunState {
  activeRunId: string | null;
  startedAt: number | null;
}

export function createRunState(): RunState {
  return {activeRunId: null, startedAt: null};
}

export function ensureRunStarted(state: RunState, send: (msg: any) => void) {
  if (!state.activeRunId) {
    state.activeRunId = crypto.randomUUID();
    state.startedAt = Date.now();
    send({
      type: 'runStart',
      protocol_version: '1.0.0',
      run_id: state.activeRunId,
      room_id: 'room-1',
      player_id: 'p1',
      start_time: state.startedAt
    });
    // Auto-end the run after a short demo duration (e.g., 300ms) for test purposes.
    const runId = state.activeRunId;
    setTimeout(() => {
      if (state.activeRunId === runId) {
        endRun(state, send, 'timeout', Math.floor((Date.now() - (state.startedAt||Date.now()))/10));
      }
    }, 300);
  }
}

export function endRun(state: RunState, send: (msg: any) => void, cause: 'collision'|'timeout'|'disconnect'|'server_shutdown', score = 0) {
  if (!state.activeRunId) return;
  const runId = state.activeRunId;
  state.activeRunId = null;
  const end = Date.now();
  send({
    type: 'runEnd',
    protocol_version: '1.0.0',
    run_id: runId,
    end_time: end,
    score,
    cause
  });
}