// Run manager service (T021)
import { Run, RunTerminationCause } from "../models/Run.ts";
import { Room } from "../models/Room.ts";
import { Player } from "../models/Player.ts";
import { TICK_MS } from "../../../../shared/src/physics/constants.ts";

function ulidLike() {
  return Math.random().toString(36).slice(2, 12);
}

export class RunManager {
  startRun(player: Player, room: Room): Run | null {
    // Allow new run if player is idle or has previously ended a run.
    if (player.state === "active") return null;
    if (player.state === "ended") {
      // reset to idle semantics for restart
      player.state = "idle";
    }
    const run = new Run({
      run_id: ulidLike(),
      player_id: player.player_id,
      room_id: room.room_id,
      started_seq: room.seq,
      engraving_deadline_ms: Date.now() + room.config.engraving_window_ms,
      is_bot: false,
    });
    room.runs.set(run.run_id, run);
    player.startRun(run.run_id);
    return run;
  }

  endRun(run: Run, room: Room, cause: RunTerminationCause) {
    run.finalize(room.seq, TICK_MS, cause);
    // Update owning player's state if still active on this run
    const player = room.humans.get(run.player_id);
    if (player && player.active_run_id === run.run_id) {
      player.endRun();
    }
    // update scoreboard (simple: keep ended runs sorted)
    room.scoreboard = Array.from(room.runs.values()).filter(
      (r) => r.state === "ended",
    );
    room.scoreboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.elapsed_ms !== b.elapsed_ms) return a.elapsed_ms - b.elapsed_ms;
      return a.run_id.localeCompare(b.run_id);
    });
    room.scoreboard = room.scoreboard.slice(0, 50);
  }
}

export const runManager = new RunManager();
