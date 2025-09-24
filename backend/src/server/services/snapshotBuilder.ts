// Snapshot builder (T022)
import { Room } from "../models/Room.ts";

export interface SnapshotMessage {
  type: "snapshot";
  protocol_version: string;
  room_id: string;
  seq: string;
  active: any[];
  top: any[];
  pipes: any[];
}

export function buildSnapshot(
  room: Room,
  protocolVersion: string,
): SnapshotMessage {
  const active: any[] = [];
  for (const p of room.humans.values()) {
    if (p.state === "active" && p.active_run_id) {
      active.push({
        id: p.player_id,
        is_bot: false,
        x: p.physics.x,
        y: p.physics.y,
        vy: p.physics.vy,
        score: 0,
        pipes_passed: 0,
      });
    }
  }
  for (const b of room.bots.values()) {
    if (b.active_run_id) {
      active.push({
        id: b.bot_id,
        is_bot: true,
        x: b.physics.x,
        y: b.physics.y,
        vy: b.physics.vy,
        score: 0,
        pipes_passed: 0,
      });
    }
  }
  const top = room.scoreboard.slice(0, 10).map((r) => ({
    run_id: r.run_id,
    name: r.engraving?.name,
    score: r.score,
    distance: r.distance,
    pipes_passed: r.pipes_passed,
    elapsed_ms: r.elapsed_ms,
  }));
  const pipes = room.track.getSlice(0, 5); // simple slice for now
  return {
    type: "snapshot",
    protocol_version: protocolVersion,
    room_id: room.room_id,
    seq: room.seq.toString(),
    active,
    top,
    pipes,
  };
}
