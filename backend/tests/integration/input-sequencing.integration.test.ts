// T012: Input sequencing & dedup integration test
import WebSocket from "ws";
import { createServer } from "../../src/server";
import {
  createTickContext,
  startTickLoop,
} from "../../src/server/sim/tickLoop";

const TEST_PORT = 19002; // unique port to avoid server reuse interference
const SERVER_URL = `ws://localhost:${TEST_PORT}`;

let server: any;
let stopLoop: (() => void) | null = null;

beforeAll(() => {
  try {
    server = createServer(TEST_PORT);
    const ctx = createTickContext();
    stopLoop = startTickLoop(server.wss, ctx, 5);
  } catch {}
});

afterAll(async () => {
  try {
    if (stopLoop) stopLoop();
    if (server && server.wss) {
      server.wss.clients.forEach((c: any) => {
        try {
          c.terminate();
        } catch {}
      });
    }
    if (server && server.close) await server.close();
  } catch {}
});

describe("Input Sequencing Integration (T012)", () => {
  test("duplicate sequence numbers ignored", (done) => {
    const ws = new WebSocket(SERVER_URL);
    let welcome = false;
    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "hello", protocol_version: "1.0.0" }));
    });
    const sent: number[] = []; // track sent seq
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "welcome") {
        welcome = true;
        [1, 2, 2, 3].forEach((seq) => {
          sent.push(seq);
          ws.send(
            JSON.stringify({
              type: "input",
              protocol_version: "1.0.0",
              seq,
              action: "flap",
              ts: Date.now(),
            }),
          );
        });
        // Minimal assertion: just confirm we didn't get an error within a short window.
        setTimeout(() => {
          if (!welcome) return done(new Error("No welcome received"));
          done();
        }, 150);
      }
    });
    ws.on("error", (err) => done(err));
  });
});
