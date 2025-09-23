// T026: Tick loop & snapshot broadcasting
import {WebSocketServer, WebSocket} from 'ws';
import {log} from '../../ws/log.js';

export interface PlayerSimState {
  id: string;
  x: number; y: number; vx: number; vy: number; state: 'idle'|'alive'|'dead';
}

export interface TickContext {
  serverTick: number;
  players: Map<WebSocket, PlayerSimState>;
  leaderboard: {player_id:string; name:string; score:number; rank:number; at:number;}[];
}

export function createTickContext(): TickContext {
  return {serverTick: 0, players: new Map(), leaderboard: []};
}

export function startTickLoop(wss: WebSocketServer, ctx: TickContext, intervalMs = 1000/60) {
  const handle = setInterval(() => {
    ctx.serverTick++;
    if (ctx.serverTick % 60 === 0) {
      log.debug('tick_heartbeat', {ticks: ctx.serverTick});
    }
    // Build minimal snapshot (pipes_window stubbed empty)
    const snapshot = {
      type: 'snapshot',
      protocol_version: '1.0.0',
      server_tick: ctx.serverTick,
      players: Array.from(ctx.players.values()),
      pipes_window: {x:[], gapY:[], gapH:[], id:[]},
      leaderboard_topN: ctx.leaderboard.slice(0,10)
    };
    const data = JSON.stringify(snapshot);
    wss.clients.forEach(c => {
      const state = (c as any).state;
      if (!state || !state.welcomed) return; // gate snapshots until handshake complete
      if ((c as any).readyState === WebSocket.OPEN) c.send(data);
    });
  }, intervalMs);
  return () => clearInterval(handle);
}