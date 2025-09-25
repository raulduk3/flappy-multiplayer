// T024: Server bootstrap
import { WebSocketServer } from "ws";
import { createServer as createHttpServer, Server as HttpServer } from "http";
import { log } from "./ws/log.ts";
import { attachRouter, createConnectionState } from "./ws/router.ts";

export interface RunningServer {
  wss: WebSocketServer;
  http: HttpServer;
  close: () => Promise<void>;
  port: number;
}

export function createServer(port: number = 19001): RunningServer {
  const http = createHttpServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  const wss = new WebSocketServer({ server: http, path: "/ws" });
  wss.on("connection", (ws) => {
    log.info("ws_connection");
    const state = createConnectionState();
    (ws as any).state = state; // expose for tick loop gating
    attachRouter(ws, state);
  });
  http.listen(port);
  return {
    wss,
    http,
    port,
    close: () =>
      new Promise((resolve) => {
        wss.close(() => http.close(() => resolve()));
      }),
  };
}
