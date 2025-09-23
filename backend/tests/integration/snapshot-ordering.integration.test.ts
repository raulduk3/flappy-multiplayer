// T013: Snapshot ordering integration test
import WebSocket from 'ws';
import {createServer} from '../../src/server';
import {createTickContext, startTickLoop} from '../../src/server/sim/tickLoop';

const TEST_PORT = 19001;
const SERVER_URL = `ws://localhost:${TEST_PORT}`;

let server: any; let stopLoop: (()=>void)|null = null;

beforeAll(() => {
  try {
    server = createServer(TEST_PORT);
    const ctx = createTickContext();
    stopLoop = startTickLoop(server.wss, ctx, 5);
  } catch {}
});

afterAll(async () => {
  if (stopLoop) stopLoop();
  if (server && server.close) await server.close();
});

describe('Snapshot Ordering Integration (T013)', () => {
  test('server_tick strictly increases', (done) => {
    const ws = new WebSocket(SERVER_URL);
    const ticks: number[] = [];
    const timeout = setTimeout(() => {
      ws.close();
      if (ticks.length < 2) return done(new Error('Insufficient snapshots collected'));
      for (let i=1;i<ticks.length;i++) {
        if (!(ticks[i] > ticks[i-1])) return done(new Error('Non-increasing server_tick detected'));
      }
      done();
    }, 400);

    ws.on('open', () => {
      ws.send(JSON.stringify({type:'hello', protocol_version:'1.0.0'}));
    });
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'snapshot') {
        ticks.push(msg.server_tick);
      }
    });
    ws.on('error', (err) => {
      clearTimeout(timeout);
      done(err);
    });
  });
});
