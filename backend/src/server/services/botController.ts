// Bot controller logic (T025)
import { Room } from "../models/Room.ts";
import { applyFlap } from "../physics/integrator.ts";

export function driveBots(room: Room) {
  for (const bot of room.bots.values()) {
    // Simple heuristic: random occasional flap to keep in bounds (placeholder)
    if (Math.random() < 0.02) {
      applyFlap(bot.physics);
    }
  }
}
