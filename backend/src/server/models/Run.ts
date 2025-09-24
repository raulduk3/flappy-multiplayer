// Run model (T006)
export type RunTerminationCause =
  | "collision"
  | "boundary"
  | "cheat-removal"
  | "disconnect"
  | "timeout"
  | "server-shutdown";

export interface RunProps {
  run_id: string;
  player_id: string; // can be bot id
  room_id: string;
  started_seq: bigint;
  engraving_deadline_ms: number;
  is_bot: boolean;
}

export class Run {
  readonly run_id: string;
  readonly player_id: string;
  readonly room_id: string;
  readonly started_seq: bigint;
  ended_seq?: bigint;
  state: "active" | "ended" = "active";
  score = 0;
  pipes_passed = 0;
  distance = 0;
  elapsed_ms = 0;
  termination_cause?: RunTerminationCause;
  engraving_deadline_ms: number;
  engraving?: { name: string; submitted_at: number };
  readonly is_bot: boolean;

  constructor(p: RunProps) {
    this.run_id = p.run_id;
    this.player_id = p.player_id;
    this.room_id = p.room_id;
    this.started_seq = p.started_seq;
    this.engraving_deadline_ms = p.engraving_deadline_ms;
    this.is_bot = p.is_bot;
  }

  finalize(seq: bigint, tick_ms: number, cause: RunTerminationCause) {
    if (this.state === "ended") return; // idempotent
    this.ended_seq = seq;
    this.elapsed_ms = Number(seq - this.started_seq) * tick_ms;
    this.termination_cause = cause;
    this.state = "ended";
  }

  setEngraving(name: string, submitted_at: number) {
    if (this.engraving) throw new Error("engraving immutable");
    this.engraving = { name, submitted_at };
  }
}
