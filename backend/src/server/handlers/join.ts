// Join handler (T026)
import { roomRegistry } from "../services/roomRegistry.ts";
import { Player } from "../models/Player.ts";
import { createInitialPhysics } from "../physics/integrator.ts";
import { DEFAULT_ROOM_CONFIG } from "../config/roomConfig.ts";

export function handleJoin(connectionId: string, send: (msg: any) => void) {
  const player = new Player({
    player_id: connectionId,
    room_id: "",
    connection_id: connectionId,
    created_at: Date.now(),
    physics: createInitialPhysics(),
  });
  const room = roomRegistry.assignPlayer(player);
  player.room_id = room.room_id;
  send({
    type: "joinAck",
    protocol_version: "1.0.0",
    room_id: room.room_id,
    max_humans: room.config.max_humans,
    bots_per_human: room.config.bots_per_human,
    tick_hz: room.config.tick_hz,
    pipe_weight: room.config.pipe_weight,
    distance_weight: room.config.distance_weight,
    engraving_window_ms: room.config.engraving_window_ms,
  });
  return { player, room };
}
