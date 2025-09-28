import { v4 as uuidv4 } from "uuid";
import { buildLogEntry, createLogger } from "../shared/logging.js";
import { newRunId } from "../shared/ids.js";
import { step, collidesWithBounds, collidesWithPipe } from "../shared/physics.js";
import { PhysicsConstants, TrackConfig } from "../shared/constants.js";
import { getPipesAtTick, getPipeSpacingPx } from "../shared/track.js";
function sendJson(ws, obj) {
    try {
        ws.send(JSON.stringify(obj));
    }
    catch { }
}
export class Room {
    id;
    seed;
    capacity;
    protocolVersion;
    sessions = new Map();
    physicsTimer = null;
    snapshotTimer = null;
    tick = 0; // 60 Hz physics tick
    onLog;
    logger;
    constructor(opts) {
        this.id = opts.id;
        this.seed = opts.seed;
        this.capacity = opts.capacity;
        this.protocolVersion = opts.protocolVersion;
        this.onLog = opts.onLog;
        this.logger = opts.logger ?? createLogger();
    }
    size() { return this.sessions.size; }
    hasSpace() { return this.sessions.size < this.capacity; }
    addSession(sessionId, ws) {
        if (this.sessions.has(sessionId))
            return;
        const WORLD_HEIGHT = 600;
        // Start idle state; run begins on first flap
        const state = { x: 0, y: 0, vx: 0, vy: 0 };
        const sess = {
            ws,
            sessionId,
            joined: false,
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
                    if (!sess.activeRunId || !sess.alive)
                        continue;
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
                            type: "runEnd.event",
                            payload: {
                                room_id: this.id,
                                run_id: sess.activeRunId,
                                final_distance: sess.distance,
                                final_score: sess.score,
                                reason: "collision",
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
                const players = [];
                for (const s of this.sessions.values()) {
                    if (s.activeRunId && s.alive) {
                        players.push({
                            player_id: s.sessionId,
                            run_id: s.activeRunId,
                            position: { x: s.distance, y: s.state.y },
                            velocity: { x: s.state.vx, y: s.state.vy },
                            status: "alive",
                            distance: s.distance,
                            score: s.score,
                        });
                    }
                }
                for (const sess of this.sessions.values()) {
                    if (!sess.joined)
                        continue;
                    const payload = { room_id: this.id, tick: this.tick, seed: this.seed, players };
                    const msg = { protocol_version: this.protocolVersion, type: "snapshot.event", payload };
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
    handleJoin(sessionId, messageId) {
        const sess = this.sessions.get(sessionId);
        if (!sess)
            return;
        sess.joined = true;
        const joinAck = {
            protocol_version: this.protocolVersion,
            type: "join.ack",
            payload: { room_id: this.id, seed: this.seed },
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
        });
        this.onLog?.(entry);
        this.logger.info(entry);
    }
    handleFlap(sessionId, messageId) {
        const sess = this.sessions.get(sessionId);
        if (!sess)
            return;
        if (!sess.joined)
            return; // ignore pre-join
        // Rate limit 5/s
        const now = Date.now();
        sess.flapTimes = sess.flapTimes.filter((t) => now - t < 1000);
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
                type: "runStart.event",
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
    removeSession(sessionId) {
        const sess = this.sessions.get(sessionId);
        if (!sess)
            return;
        try {
            sess.ws.close();
        }
        catch { }
        this.sessions.delete(sessionId);
        // Stop timers if room becomes empty
        if (this.sessions.size === 0)
            this.stop();
    }
    stop() {
        if (this.physicsTimer) {
            try {
                clearInterval(this.physicsTimer);
            }
            catch { }
            this.physicsTimer = null;
        }
        if (this.snapshotTimer) {
            try {
                clearInterval(this.snapshotTimer);
            }
            catch { }
            this.snapshotTimer = null;
        }
    }
}
