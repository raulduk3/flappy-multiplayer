// Player model (T007)
export type PlayerState = "idle" | "active" | "ended";

export interface PhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PlayerProps {
  player_id: string;
  room_id: string;
  connection_id: string; // reference to ws connection
  created_at: number;
  physics: PhysicsState;
}

export class Player {
  readonly player_id: string;
  room_id: string;
  connection_id: string;
  state: PlayerState = "idle";
  active_run_id?: string;
  last_input_seq?: bigint;
  violation_streak = 0;
  created_at: number;
  disconnected = false;
  physics: PhysicsState;
  // Previous tick physics snapshot for anti-cheat delta comparisons
  prevPhysics?: PhysicsState;

  constructor(p: PlayerProps) {
    this.player_id = p.player_id;
    this.room_id = p.room_id;
    this.connection_id = p.connection_id;
    this.created_at = p.created_at;
    this.physics = p.physics;
  }

  startRun(run_id: string) {
    if (this.state === "active") return false;
    // Allow restart from 'ended' by transitioning through idle semantics
    if (this.state === "ended") this.state = "idle";
    this.state = "active";
    this.active_run_id = run_id;
    // Initialize prevPhysics at run start
    this.prevPhysics = { ...this.physics };
    return true;
  }

  endRun() {
    if (this.state === "ended") return;
    this.state = "ended";
    this.active_run_id = undefined;
  }
}
