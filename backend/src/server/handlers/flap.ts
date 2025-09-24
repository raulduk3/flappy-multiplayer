// Flap handler (T027)
import { applyFlap } from "../physics/integrator.ts";
import { Player } from "../models/Player.ts";
import { Run } from "../models/Run.ts";
import { runManager } from "../services/runManager.ts";
import { Room } from "../models/Room.ts";

export function handleFlap(player: Player, room: Room) {
  // Start run if not currently active (idle or ended -> new run)
  if (player.state !== "active") {
    const run = runManager.startRun(player, room);
    if (run) {
      // run started
    }
  }
  // Apply flap impulse
  applyFlap(player.physics);
}
