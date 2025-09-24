// Room model (T005)
import { Track } from "./Track.ts";
import { Run } from "./Run.ts";
import { Player } from "./Player.ts";
import { Bot } from "./Bot.ts";
import { DEFAULT_ROOM_CONFIG, RoomConfig } from "../config/roomConfig.ts";
import { randomSeed } from "../../../../shared/src/track/seed.ts";

let ulid: (() => string) | null = null;
try {
  ulid = require("ulid").ulid;
} catch {
  /* optional */
}
function genId(prefix?: string) {
  const id = ulid ? ulid() : Math.random().toString(36).slice(2);
  return prefix ? prefix + id : id;
}

export class Room {
  readonly room_id: string;
  readonly seed: bigint;
  readonly created_at: number;
  readonly humans = new Map<string, Player>();
  readonly bots = new Map<string, Bot>();
  readonly runs = new Map<string, Run>();
  readonly track: Track;
  readonly config: RoomConfig;
  seq: bigint = 1n;
  scoreboard: Run[] = [];

  constructor(config: RoomConfig = DEFAULT_ROOM_CONFIG) {
    this.room_id = genId();
    this.seed = randomSeed();
    this.created_at = Date.now();
    this.config = config;
    this.track = new Track(this.seed);
  }

  addPlayer(p: Player) {
    this.humans.set(p.player_id, p);
  }
  removePlayer(id: string) {
    this.humans.delete(id);
  }

  spawnBotsForCurrentHumans() {
    const desired = this.humans.size * this.config.bots_per_human;
    while (this.bots.size < desired) {
      const botId = "bot_" + genId();
      this.bots.set(
        botId,
        new Bot({
          bot_id: botId,
          room_id: this.room_id,
          created_at: Date.now(),
          physics: { x: 0, y: 0, vx: 0, vy: 0 },
        }),
      );
    }
  }

  nextSeq(): bigint {
    this.seq = this.seq + 1n;
    return this.seq;
  }
}
