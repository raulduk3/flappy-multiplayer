// Run end broadcast logic (T030)
import { Room } from "../models/Room.ts";
import { Run } from "../models/Run.ts";
import { runManager } from "../services/runManager.ts";

export function broadcastRunEnd(
  run: Run,
  room: Room,
  send: (msg: any) => void,
) {
  send({
    type: "runEnd",
    protocol_version: "1.0.0",
    room_id: room.room_id,
    run_id: run.run_id,
    player_id: run.player_id,
    is_bot: run.is_bot,
    score: run.score,
    distance: run.distance,
    pipes_passed: run.pipes_passed,
    elapsed_ms: run.elapsed_ms,
    cause: run.termination_cause || "timeout",
    engraving: run.engraving ? { name: run.engraving.name } : undefined,
  });
}
