export interface InputMsg {
  type: "input";
  protocol_version: string;
  seq: number;
  action: "flap" | "start" | "join";
  ts: number;
}

export interface QueueState {
  lastAppliedSeq: number;
  queued: InputMsg[];
}

export class InputQueue {
  private version: string;
  private nextSeq = 1;
  private queued: InputMsg[] = [];
  private lastAppliedSeq = 0;

  constructor(version: string) {
    this.version = version;
  }

  makeFlap(ts: number): InputMsg {
    return {
      type: "input",
      protocol_version: this.version,
      seq: this.nextSeq++,
      action: "flap",
      ts: Math.floor(ts),
    };
  }

  queue(msg: InputMsg) {
    if (msg.seq <= this.lastAppliedSeq) return; // drop duplicates/stale
    this.queued.push(msg);
  }

  markApplied(seq: number) {
    if (seq > this.lastAppliedSeq) this.lastAppliedSeq = seq;
    // drop any queued <= lastAppliedSeq
    this.queued = this.queued.filter((m) => m.seq > this.lastAppliedSeq);
  }

  flush(send: (m: InputMsg) => void) {
    // sort by seq and send
    this.queued.sort((a, b) => a.seq - b.seq).forEach(send);
    this.queued = [];
  }

  getState(): QueueState {
    return { lastAppliedSeq: this.lastAppliedSeq, queued: [...this.queued] };
  }
}
