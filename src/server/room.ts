import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { buildLogEntry, createLogger, Logger } from "../shared/logging.js";
import { newRunId } from "../shared/ids.js";
import { step, collidesWithBounds, collidesWithPipe } from "../shared/physics.js";
import { PhysicsConstants, TrackConfig } from "../shared/constants.js";
import { getPipesAtTick, getPipeSpacingPx } from "../shared/track.js";
import type { LeaderboardEntry } from "../shared/types.js";

// Internal leaderboard row with additional fields not exposed in payload
type LBRow = LeaderboardEntry & { distance: number };

export interface RoomOptions {
  id: string;
  seed: string;
  capacity: number;
  protocolVersion: string; // e.g., "1"
  onLog?: (entry: any) => void; // test hook
  logger?: Logger;
}

export interface SessionState {
  ws: WebSocket;
  sessionId: string;
  joined: boolean;
  color?: string;
  activeRunId: string | null;
  state: { x: number; y: number; vx: number; vy: number };
  distance: number;
  score: number;
  alive: boolean;
  pendingFlap: boolean;
  flapTimes: number[]; // timestamps (ms) within last 1000ms
  lastPipeIndexPassed: number; // -1 before first pipe
}

function sendJson(ws: WebSocket, obj: unknown) {
  try {
    ws.send(JSON.stringify(obj));
  } catch {}
}

export class Room {
  readonly id: string;
  readonly seed: string;
  readonly capacity: number;
  readonly protocolVersion: string;
  private sessions: Map<string, SessionState> = new Map();
  private physicsTimer: NodeJS.Timeout | null = null;
  private snapshotTimer: NodeJS.Timeout | null = null;
  private tick: number = 0; // 60 Hz physics tick
  private onLog?: (entry: any) => void;
  private logger: Logger;
  private leaderboard: LBRow[] = [];

  constructor(opts: RoomOptions) {
    this.id = opts.id;
    this.seed = opts.seed;
    this.capacity = opts.capacity;
    this.protocolVersion = opts.protocolVersion;
    this.onLog = opts.onLog;
    this.logger = opts.logger ?? createLogger();
  }

  size() { return this.sessions.size; }

  hasSpace() { return this.sessions.size < this.capacity; }

  addSession(sessionId: string, ws: WebSocket) {
    if (this.sessions.has(sessionId)) return;
    const WORLD_HEIGHT = 600;
    // Start idle state; run begins on first flap
    const state = { x: 0, y: 0, vx: 0, vy: 0 };
    const sess: SessionState = {
      ws,
      sessionId,
      joined: false,
      color: undefined,
      activeRunId: null,
      state,
      distance: 0,
      score: 0,
      alive: true,
      pendingFlap: false,
      flapTimes: [],
      lastPipeIndexPassed: -1,
    };
    this.sessions.set(sessionId, sess);
    // Lazily start timers when first session is added
    if (!this.physicsTimer) {
      this.physicsTimer = setInterval(() => {
        this.tick += 1;
        // Per-session physics
        for (const sess of this.sessions.values()) {
          if (!sess.activeRunId || !sess.alive) continue;
          sess.state = step(sess.state, 1 / 60, { flap: sess.pendingFlap });
          sess.pendingFlap = false;
          sess.distance += PhysicsConstants.forwardVelocity * (1 / 60);
          // Compute world-space position used for collisions (distance acts as x)
          const worldPos = { x: sess.distance, y: sess.state.y };
          // Check bounds and pipe collisions
          let collided = collidesWithBounds(worldPos, WORLD_HEIGHT);
          if (!collided) {
            const pipes = getPipesAtTick(this.seed, this.tick, { worldHeight: WORLD_HEIGHT, countBefore: 1, countAfter: 5, baseDistance: sess.distance });
            for (const p of pipes) {
              if (collidesWithPipe(worldPos, p.x, p.width, p.gapCenterY, p.gapHeight, WORLD_HEIGHT)) {
                collided = true;
                break;
              }
            }
          }
          // Scoring: increment when fully passing a pipe's right edge
          if (!collided) {
            const spacingPx = getPipeSpacingPx();
            for (const p of getPipesAtTick(this.seed, this.tick, { worldHeight: WORLD_HEIGHT, countBefore: 1, countAfter: 5, baseDistance: sess.distance })) {
              if (p.x + p.width <= sess.distance) {
                // Recover pipe index from x; i = (x - offset)/spacing - 1
                const iFloat = (p.x - TrackConfig.initialOffsetPx) / spacingPx - 1;
                const i = Math.round(iFloat);
                if (i > sess.lastPipeIndexPassed) {
                  sess.lastPipeIndexPassed = i;
                  sess.score += 1;
                }
              }
            }
          }
          if (collided && sess.alive && sess.activeRunId) {
            sess.alive = false;
            const runEnd = {
              protocol_version: this.protocolVersion,
              type: "runEnd.event" as const,
              payload: {
                room_id: this.id,
                run_id: sess.activeRunId,
                final_distance: sess.distance,
                final_score: sess.score,
                reason: "collision" as const,
              },
            };
            sendJson(sess.ws, runEnd);
            const entry = buildLogEntry({
              session_id: sess.sessionId,
              direction: "outbound",
              protocol_version: this.protocolVersion,
              type: "runEnd.event",
              message_id: uuidv4(),
              room_id: this.id,
              run_id: runEnd.payload.run_id,
              final_distance: runEnd.payload.final_distance,
              final_score: runEnd.payload.final_score,
            });
            this.onLog?.(entry);
            this.logger.info(entry);
            // Record on leaderboard and broadcast update
            this.recordLeaderboardEntry({
              player_id: sess.sessionId,
              color: sess.color ?? "#FFCC00",
              score: sess.score,
              distance: sess.distance,
              ended_at: Date.now(),
            });
            // Reset run to allow restart on next flap
            sess.activeRunId = null;
            sess.pendingFlap = false;
          }
        }
      }, 16);
    }

    if (!this.snapshotTimer) {
      this.snapshotTimer = setInterval(() => {
        // For each joined session, send a snapshot including all alive players
        const players = [] as any[];
        const participants = [] as any[];
        for (const s of this.sessions.values()) {
          // participants: include all joined sessions
          if (s.joined) {
            const base: any = { player_id: s.sessionId, status: s.activeRunId && s.alive ? "active" : "idle", color: s.color };
            if (base.status === "active") {
              base.position = { x: s.distance, y: s.state.y };
              base.velocity = { x: s.state.vx, y: s.state.vy };
              base.distance = s.distance;
            }
            participants.push(base);
          }
          if (s.activeRunId && s.alive) {
            players.push({
              player_id: s.sessionId,
              run_id: s.activeRunId,
              position: { x: s.distance, y: s.state.y },
              velocity: { x: s.state.vx, y: s.state.vy },
              status: "alive",
              distance: s.distance,
              score: s.score,
              ...(s.color ? { color: s.color } : {}),
            });
          }
        }
        for (const sess of this.sessions.values()) {
          if (!sess.joined) continue;
          const payload: any = { room_id: this.id, tick: this.tick, seed: this.seed, players };
          if (participants.length > 0) payload.participants = participants;
          const msg = { protocol_version: this.protocolVersion, type: "snapshot.event" as const, payload };
          sendJson(sess.ws, msg);
          const entry = buildLogEntry({
            session_id: sess.sessionId,
            direction: "outbound",
            protocol_version: this.protocolVersion,
            type: "snapshot.event",
            message_id: uuidv4(),
            room_id: this.id,
            seed: this.seed,
            tick: this.tick,
          });
          this.onLog?.(entry);
          this.logger.info(entry);
        }
      }, 22);
    }

    return sess;
  }

  handleJoin(sessionId: string, messageId: string, payload?: any) {
    const sess = this.sessions.get(sessionId);
    if (!sess) return;
    sess.joined = true;
    // Capture color if provided and valid-ish (#RRGGBB)
    const color = payload?.color;
    if (typeof color === "string" && /^#([0-9a-fA-F]{6})$/.test(color)) {
      sess.color = color;
    } else {
      // default random color if none provided
      const rnd = () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
      sess.color = `#${rnd()}${rnd()}${rnd()}`;
    }
    const joinAck = {
      protocol_version: this.protocolVersion,
      type: "join.ack" as const,
      payload: { room_id: this.id, seed: this.seed, color: sess.color },
    };
    sendJson(sess.ws, joinAck);
    const entry = buildLogEntry({
      session_id: sessionId,
      direction: "outbound",
      protocol_version: this.protocolVersion,
      type: "join.ack",
      message_id: messageId,
      room_id: this.id,
      seed: this.seed,
      color: sess.color,
    });
    this.onLog?.(entry);
    this.logger.info(entry);
  }

  handleFlap(sessionId: string, messageId: string) {
    const sess = this.sessions.get(sessionId);
    if (!sess) return;
    if (!sess.joined) return; // ignore pre-join
    // Rate limit 5/s
    const now = Date.now();
    sess.flapTimes = sess.flapTimes.filter((t) => now - t < 1000);
    // Allow up to 5 flaps in the last 1000ms; 6th within the window is rate-limited
    if (sess.flapTimes.length >= 5) {
      sendJson(sess.ws, { status: "error", reason: "rate_limited", message_id: messageId });
      const entry = buildLogEntry({
        session_id: sessionId,
        direction: "outbound",
        protocol_version: this.protocolVersion,
        type: "ack.error",
        message_id: messageId,
      });
      this.onLog?.(entry);
      this.logger.info(entry);
      return;
    }
    sess.flapTimes.push(now);
    if (!sess.activeRunId) {
      // Start new run
      const WORLD_HEIGHT = 600;
      const startY = WORLD_HEIGHT * 0.5 - PhysicsConstants.hitbox.height / 2;
      sess.state = { x: 0, y: startY, vx: 0, vy: 0 };
      sess.distance = 0;
      sess.score = 0;
      sess.lastPipeIndexPassed = -1;
      sess.alive = true;
      sess.activeRunId = newRunId();
      const runStart = {
        protocol_version: this.protocolVersion,
        type: "runStart.event" as const,
        payload: { room_id: this.id, run_id: sess.activeRunId, tick: 0 },
      };
      sendJson(sess.ws, runStart);
      const entry = buildLogEntry({
        session_id: sessionId,
        direction: "outbound",
        protocol_version: this.protocolVersion,
        type: "runStart.event",
        message_id: messageId,
        room_id: this.id,
        run_id: runStart.payload.run_id,
      });
      this.onLog?.(entry);
      this.logger.info(entry);
    }
    // Queue one-shot flap
    sess.pendingFlap = true;
  }

  // Maintain and broadcast per-room leaderboard
  private recordLeaderboardEntry(e: LBRow) {
    this.leaderboard.push(e);
    this.leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.distance !== a.distance) return b.distance - a.distance; // farther distance wins ties on score
      return a.ended_at - b.ended_at; // earlier wins remaining ties
    });
    if (this.leaderboard.length > 10) this.leaderboard.length = 10;
    // Broadcast to all joined sessions
    for (const s of this.sessions.values()) {
      if (!s.joined) continue;
      const payload = { room_id: this.id, entries: this.leaderboard.map(({ distance: _d, ...rest }) => rest) };
      const msg = { protocol_version: this.protocolVersion, type: "leaderboardUpdate.event" as const, payload };
      sendJson(s.ws, msg);
      const entry = buildLogEntry({
        session_id: s.sessionId,
        direction: "outbound",
        protocol_version: this.protocolVersion,
        type: "leaderboardUpdate.event",
        message_id: uuidv4(),
        room_id: this.id,
        // Include the top finisher (if any) for quick indexing; detailed entries are in payload
        player_id: this.leaderboard[0]?.player_id,
        score: this.leaderboard[0]?.score,
        ended_at: this.leaderboard[0]?.ended_at,
      });
      this.onLog?.(entry);
      this.logger.info(entry);
    }
  }

  removeSession(sessionId: string) {
    const sess = this.sessions.get(sessionId);
    if (!sess) return;
    // If disconnecting while active, record leaderboard entry
    if (sess.activeRunId && sess.alive) {
      this.recordLeaderboardEntry({
        player_id: sess.sessionId,
        color: sess.color ?? "#FFCC00",
        score: sess.score,
        distance: sess.distance,
        ended_at: Date.now(),
      });
      sess.alive = false;
      sess.activeRunId = null;
      sess.pendingFlap = false;
    }
    try { sess.ws.close(); } catch {}
    this.sessions.delete(sessionId);
    // Stop timers if room becomes empty
    if (this.sessions.size === 0) this.stop();
  }

  stop() {
    if (this.physicsTimer) { try { clearInterval(this.physicsTimer); } catch {} this.physicsTimer = null; }
    if (this.snapshotTimer) { try { clearInterval(this.snapshotTimer); } catch {} this.snapshotTimer = null; }
  }
}

// Leaderboard helpers
// (intentionally no exports from this module)
