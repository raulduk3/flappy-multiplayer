// T024: Server bootstrap
import { WebSocketServer } from "ws";
import { attachRouter, createConnectionState } from "./ws/router.ts";

export interface RunningServer {
  wss: WebSocketServer;
  close: () => Promise<void>;
  port: number;
}

export function createServer(port: number = 19001): RunningServer {
  const wss = new WebSocketServer({ port });
  wss.on("connection", (ws) => {
    const state = createConnectionState();
    (ws as any).state = state; // expose for tick loop gating
    attachRouter(ws, state);
  });
  return {
    wss,
    port,
    close: () =>
      new Promise((resolve) => {
        wss.close(() => resolve());
      }),
  };
}
