// T011: Error semantics integration test - expects server error mapping (T023) and version handling
import WebSocket from "ws";
import { createServer } from "../../src/server";
import {
  createTickContext,
  startTickLoop,
} from "../../src/server/sim/tickLoop";

const TEST_PORT = 19001;
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
  if (stopLoop) stopLoop();
  if (server && server.close) await server.close();
});

describe("Error Semantics Integration (T011)", () => {
  test("incompatible protocol version yields incompatible_protocol error", (done) => {
    const ws = new WebSocket(SERVER_URL);
    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "hello", protocol_version: "2.0.0" })); // assuming server MAJOR=1
    });
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      try {
        expect(msg.type).toBe("error");
        expect(msg.code).toBe("incompatible_protocol");
        done();
      } catch (e) {
        done(e);
      } finally {
        ws.close();
      }
    });
    ws.on("error", (err) => done(err));
  });

  test("malformed message returns validation_error", (done) => {
    const ws = new WebSocket(SERVER_URL);
    ws.on("open", () => {
      // Missing protocol_version
      ws.send(JSON.stringify({ type: "hello" }));
    });
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "error") {
        try {
          expect(msg.code).toBe("validation_error");
          done();
        } catch (e) {
          done(e);
        } finally {
          ws.close();
        }
      }
    });
    ws.on("error", (err) => done(err));
  });

  test("unsupported action pre-handshake", (done) => {
    const ws = new WebSocket(SERVER_URL);
    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          type: "input",
          protocol_version: "1.0.0",
          seq: 1,
          action: "flap",
          ts: Date.now(),
        }),
      );
    });
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "error") {
        try {
          expect(msg.code).toBe("unsupported_action");
          done();
        } catch (e) {
          done(e);
        } finally {
          ws.close();
        }
      }
    });
    ws.on("error", (err) => done(err));
  });
});
