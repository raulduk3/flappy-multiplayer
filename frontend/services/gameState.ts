export type Mode = "pre-run" | "run" | "engrave";

export interface GameState {
  mode: Mode;
  runId: string | null;
}

export interface RunStartMsg {
  type: "runStart";
  protocol_version: string;
  run_id: string;
  room_id: string;
  player_id: string;
  start_time: number;
}

export interface RunEndMsg {
  type: "runEnd";
  protocol_version: string;
  run_id: string;
  end_time: number;
  score: number;
  cause: "collision" | "timeout" | "disconnect" | "server_shutdown";
}

export function initialState(): GameState {
  return { mode: "pre-run", runId: null };
}

export function reduce(state: GameState, msg: RunStartMsg | RunEndMsg): GameState {
  switch (msg.type) {
    case "runStart": {
      return { mode: "run", runId: msg.run_id };
    }
    case "runEnd": {
      if (state.mode === "run" && state.runId === msg.run_id) {
        return { mode: "engrave", runId: msg.run_id };
      }
      // Ignore runEnd for other runs or unexpected modes
      return state;
    }
    default:
      return state;
  }
}
