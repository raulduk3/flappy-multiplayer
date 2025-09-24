// T009: Handshake integration test (will fail until server + router implemented T021+)
import WebSocket from "ws";
import { createServer } from "../../src/server";
import {
  startTickLoop,
  createTickContext,
} from "../../src/server/sim/tickLoop";

const TEST_PORT = 19001;
const SERVER_URL = `ws://localhost:${TEST_PORT}`;

let server: any;
let stopLoop: (() => void) | null = null;

describe("Handshake Integration (T009)", () => {
  beforeAll(() => {
    server = createServer(TEST_PORT);
    // start snapshot loop to satisfy snapshot-related tests when reused
    const ctx = createTickContext();
    stopLoop = startTickLoop(server.wss, ctx, 5); // faster tick for tests
  });

  afterAll(async () => {
    if (stopLoop) stopLoop();
    if (server && server.close) await server.close();
  });

  test("hello → welcome happy path", (done) => {
    const ws = new WebSocket(SERVER_URL);
    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "hello", protocol_version: "1.0.0" }));
    });
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type !== "welcome") return; // ignore early runStart or snapshot
      try {
        expect(msg.type).toBe("welcome");
        done();
      } catch (err) {
        done(err);
      } finally {
        ws.close();
      }
    });
    ws.on("error", (err) => done(err));
  });

  test("pre-handshake message rejected", (done) => {
    const ws = new WebSocket(SERVER_URL);
    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          type: "capabilities_request",
          protocol_version: "1.0.0",
        }),
      );
    });
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      try {
        expect(msg.type).toBe("error");
        expect(msg.code).toBe("unsupported_action");
        done();
      } catch (err) {
        done(err);
      } finally {
        ws.close();
      }
    });
    ws.on("error", (err) => {
      done(err);
    });
  });
});
