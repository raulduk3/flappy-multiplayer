// T010: Capabilities integration test (FR-023) - expects server to implement capabilities handler (T022)
import WebSocket from "ws";
import { createServer } from "../../src/server";
import {
  createTickContext,
  startTickLoop,
} from "../../src/server/sim/tickLoop";

const TEST_PORT = 19001; // reuse handshake port
const SERVER_URL = `ws://localhost:${TEST_PORT}`;

let server: any;
let stopLoop: (() => void) | null = null;

beforeAll(() => {
  // If already started by another test (handshake), creating on same port may throw; wrap try/catch.
  try {
    server = createServer(TEST_PORT);
    const ctx = createTickContext();
    stopLoop = startTickLoop(server.wss, ctx, 5);
  } catch (e) {
    // Ignore if address in use; assume another suite started it.
  }
});

afterAll(async () => {
  if (stopLoop) stopLoop();
  if (server && server.close) await server.close();
});

describe("Capabilities Integration (T010)", () => {
  test("request after welcome yields capabilities_response with non-empty supported_features", (done) => {
    const ws = new WebSocket(SERVER_URL);
    let welcomed = false;
    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "hello", protocol_version: "1.0.0" }));
    });
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "welcome") {
        welcomed = true;
        ws.send(
          JSON.stringify({
            type: "capabilities_request",
            protocol_version: "1.0.0",
          }),
        );
      } else if (msg.type === "capabilities_response") {
        try {
          expect(welcomed).toBe(true);
          expect(Array.isArray(msg.supported_features)).toBe(true);
          expect(msg.supported_features.length).toBeGreaterThan(0);
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
