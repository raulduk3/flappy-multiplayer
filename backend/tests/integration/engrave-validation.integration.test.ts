// T015: Engrave validation integration test
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

describe('Engrave Validation Integration (T015)', () => {
  test('invalid name (too long) rejected with error', (done) => {
    const ws = new WebSocket(SERVER_URL);
    let runId: string | null = null;
    ws.on('open', () => {
      ws.send(JSON.stringify({type:'hello', protocol_version:'1.0.0'}));
    });
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'runStart') {
        runId = msg.run_id;
        const longName = 'A'.repeat(30);
        ws.send(JSON.stringify({type:'engrave', protocol_version:'1.0.0', run_id: runId, name: longName}));
      } else if (msg.type === 'error') {
        try {
          expect(msg.code).toBe('validation_error'); // or potentially bad_request depending on mapping
          done();
        } catch (e) { done(e); }
        finally { ws.close(); }
      }
    });
    ws.on('error', (err) => done(err));
  });

  test('valid name accepted (no error)', (done) => {
    const ws = new WebSocket(SERVER_URL);
    let runId: string | null = null;
    let sent = false;
    let receivedError = false;
    const timeout = setTimeout(() => {
      ws.close();
      if (!sent) return done(new Error('Engrave not sent'));
      if (receivedError) return done(new Error('Unexpected error for valid name'));
      done();
    }, 400);

    ws.on('open', () => {
      ws.send(JSON.stringify({type:'hello', protocol_version:'1.0.0'}));
    });
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'runStart') {
        runId = msg.run_id;
        sent = true;
        ws.send(JSON.stringify({type:'engrave', protocol_version:'1.0.0', run_id: runId, name: 'PlayerOne'}));
      } else if (msg.type === 'error') {
        receivedError = true;
      }
    });
    ws.on('error', (err) => { clearTimeout(timeout); done(err); });
  });
});
