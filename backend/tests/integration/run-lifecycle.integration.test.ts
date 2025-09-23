// T014: Run lifecycle integration test (runStart/runEnd)
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

describe('Run Lifecycle Integration (T014)', () => {
  test('receive runStart then runEnd with consistent run_id', (done) => {
    const ws = new WebSocket(SERVER_URL);
    let runId: string | null = null;
    let sawStart = false;

    const finishTimeout = setTimeout(() => {
      ws.close();
      if (!sawStart) return done(new Error('Did not receive runStart'));
      if (!runId) return done(new Error('No run_id captured'));
      done(new Error('runEnd not observed before timeout (expected until lifecycle implemented)'));
    }, 500);

    ws.on('open', () => {
      ws.send(JSON.stringify({type:'hello', protocol_version:'1.0.0'}));
      // Implementation eventually triggers runStart automatically when game begins
    });
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'runStart') {
        sawStart = true;
        runId = msg.run_id;
      } else if (msg.type === 'runEnd') {
        try {
          expect(runId).toBe(msg.run_id);
          clearTimeout(finishTimeout);
          done();
        } catch (e) { done(e); }
        finally { ws.close(); }
      }
    });
    ws.on('error', (err) => { clearTimeout(finishTimeout); done(err); });
  });
});
