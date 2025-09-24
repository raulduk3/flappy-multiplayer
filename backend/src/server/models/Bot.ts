// Bot model (T008)
import { PhysicsState } from "./Player.ts";

export interface BotProps {
  bot_id: string;
  room_id: string;
  physics: PhysicsState;
  created_at: number;
}

export class Bot {
  readonly bot_id: string;
  room_id: string;
  physics: PhysicsState;
  created_at: number;
  controller: { lastDecisionSeq?: bigint } = {};
  active_run_id?: string;

  constructor(p: BotProps) {
    this.bot_id = p.bot_id;
    this.room_id = p.room_id;
    this.physics = p.physics;
    this.created_at = p.created_at;
  }
}
