// Tick loop (T029) integrating physics, bots, anti-cheat, snapshot broadcast
import { roomRegistry } from "../services/roomRegistry.ts";
import { applyTick } from "../physics/integrator.ts";
import { processAntiCheat } from "../services/antiCheatService.ts";
import { driveBots } from "../services/botController.ts";
import { buildSnapshot } from "../services/snapshotBuilder.ts";
import { tickMetrics } from "../metrics/tickMetrics.ts";

let broadcaster: ((roomId: string, snapshot: any) => void) | null = null;
export function registerSnapshotBroadcaster(
  fn: (roomId: string, snapshot: any) => void,
) {
  broadcaster = fn;
}

export function tickOnce(protocolVersion = "1.0.0") {
  const start = tickMetrics.beginTick();
  for (const room of roomRegistry.getRooms()) {
    // Advance seq
    room.nextSeq();
    // Physics update for active players (simplified: all humans + bots)
    for (const p of room.humans.values())
      if (p.state === "active") applyTick(p.physics);
    for (const b of room.bots.values())
      if (b.active_run_id) applyTick(b.physics);
    driveBots(room);
    processAntiCheat(room);
    if (broadcaster) {
      const snap = buildSnapshot(room, protocolVersion);
      const payload = JSON.stringify(snap);
      tickMetrics.endTick(start, payload.length);
      broadcaster(room.room_id, snap);
      return; // one room instrumentation (extend later for multi-room aggregation)
    }
  }
}

let interval: NodeJS.Timeout | null = null;
export function startTicks(hz = 60) {
  if (interval) return; // already running
  const ms = 1000 / hz;
  interval = setInterval(() => tickOnce("1.0.0"), ms);
}
export function stopTicks() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}
// T026: Tick loop & snapshot broadcasting
import { WebSocketServer, WebSocket } from "ws";
import { log } from "../../ws/log.ts";

export interface PlayerSimState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: "idle" | "alive" | "dead";
}

export interface TickContext {
  serverTick: number;
  players: Map<WebSocket, PlayerSimState>;
  leaderboard: {
    player_id: string;
    name: string;
    score: number;
    rank: number;
    at: number;
  }[];
}

export function createTickContext(): TickContext {
  return { serverTick: 0, players: new Map(), leaderboard: [] };
}

export function startTickLoop(
  wss: WebSocketServer,
  ctx: TickContext,
  intervalMs = 1000 / 60,
) {
  const handle = setInterval(() => {
    ctx.serverTick++;
    if (ctx.serverTick % 60 === 0) {
      log.debug("tick_heartbeat", { ticks: ctx.serverTick });
    }
    // Build minimal snapshot (pipes_window stubbed empty)
    const snapshot = {
      type: "snapshot",
      protocol_version: "1.0.0",
      server_tick: ctx.serverTick,
      players: Array.from(ctx.players.values()),
      pipes_window: { x: [], gapY: [], gapH: [], id: [] },
      leaderboard_topN: ctx.leaderboard.slice(0, 10),
    };
    const data = JSON.stringify(snapshot);
    wss.clients.forEach((c) => {
      const state = (c as any).state;
      if (!state || !state.welcomed) return; // gate snapshots until handshake complete
      if ((c as any).readyState === WebSocket.OPEN) c.send(data);
    });
  }, intervalMs);
  return () => clearInterval(handle);
}
