import { createServer as createHttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { createLogger, buildLogEntry } from "../shared/logging.js";
import type { LogEntry } from "../shared/types.js";
import { validateEnvelope, validateTestPing } from "../shared/schema.js";
import { RoomManager } from "./roomManager.js";

const SUPPORTED_PROTOCOL_VERSION = "1";

export interface StartOptions {
  port?: number; // 0 for ephemeral
  onLog?: (entry: LogEntry) => void; // test hook
}

export interface RunningServer {
  port: number;
  close: () => Promise<void>;
  wss: WebSocketServer;
}

function sendJson(ws: WebSocket, obj: unknown) {
  try {
    ws.send(JSON.stringify(obj));
  } catch {}
}

export async function startServer(
  opts: StartOptions = {},
): Promise<RunningServer> {
  const logger = createLogger();
  const httpServer = createHttpServer();
  const wss = new WebSocketServer({ server: httpServer });
  const listenPort = opts.port ?? 0; // 0 = ephemeral
  const roomManager = new RoomManager({
    protocolVersion: SUPPORTED_PROTOCOL_VERSION,
    onLog: opts.onLog,
  });

  wss.on("connection", (ws: WebSocket) => {
    const sessionId = uuidv4();
    roomManager.addSession(sessionId, ws);

    ws.on("message", (data) => {
      const raw = data.toString();
      let envelope: any;
      const messageId = uuidv4();
      try {
        envelope = JSON.parse(raw);
      } catch (err) {
        const protocol_version = "unknown";
        const type = "unknown";
        const entry = buildLogEntry({
          session_id: sessionId,
          direction: "inbound",
          protocol_version,
          type,
          message_id: messageId,
        });
        opts.onLog?.(entry);
        logger.info(entry);
        sendJson(ws, { status: "error", reason: "invalid JSON", message_id: messageId });
        const out = buildLogEntry({
          session_id: sessionId,
          direction: "outbound",
          protocol_version,
          type: "ack.error",
          message_id: messageId,
        });
        opts.onLog?.(out);
        logger.info(out);
        return;
      }

      const envRes = validateEnvelope(envelope);
      if (!envRes.ok) {
        const entry = buildLogEntry({
          session_id: sessionId,
          direction: "inbound",
          protocol_version: envelope?.protocol_version ?? "unknown",
          type: envelope?.type ?? "unknown",
          message_id: messageId,
        });
        opts.onLog?.(entry);
        logger.info(entry);
        sendJson(ws, { status: "error", reason: "invalid envelope", message_id: messageId });
        const out = buildLogEntry({
          session_id: sessionId,
          direction: "outbound",
          protocol_version: envelope?.protocol_version ?? "unknown",
          type: "ack.error",
          message_id: messageId,
        });
        opts.onLog?.(out);
        logger.info(out);
        return;
      }

      const { protocol_version, type, payload } = envelope as {
        protocol_version: string;
        type: string;
        payload: any;
      };

      const inbound = buildLogEntry({
        session_id: sessionId,
        direction: "inbound",
        protocol_version,
        type,
        message_id: messageId,
      });
      opts.onLog?.(inbound);
      logger.info(inbound);

      if (protocol_version !== SUPPORTED_PROTOCOL_VERSION) {
        sendJson(ws, { status: "error", reason: "unsupported protocol_version", message_id: messageId });
        const out = buildLogEntry({
          session_id: sessionId,
          direction: "outbound",
          protocol_version,
          type: "ack.error",
          message_id: messageId,
        });
        opts.onLog?.(out);
        logger.info(out);
        return;
      }

      if (type === "test.ping") {
        const val = validateTestPing(payload);
        if (!val.ok) {
          sendJson(ws, { status: "error", reason: "invalid payload", message_id: messageId });
          const out = buildLogEntry({
            session_id: sessionId,
            direction: "outbound",
            protocol_version,
            type: "ack.error",
            message_id: messageId,
          });
          opts.onLog?.(out);
          logger.info(out);
          return;
        }
        sendJson(ws, { status: "ok", nonce: payload.nonce as string, message_id: messageId });
        const out = buildLogEntry({
          session_id: sessionId,
          direction: "outbound",
          protocol_version,
          type: "ack.success",
          message_id: messageId,
        });
        opts.onLog?.(out);
        logger.info(out);
        return;
      }

      if (type === "join.request") {
        roomManager.handleJoin(sessionId, messageId);
        return;
      }

      if (type === "input.flap.request") {
        roomManager.handleFlap(sessionId, messageId);
        return;
      }

      // Unknown type
      sendJson(ws, { status: "error", reason: "unsupported type", message_id: messageId });
      const out = buildLogEntry({
        session_id: sessionId,
        direction: "outbound",
        protocol_version,
        type: "ack.error",
        message_id: messageId,
      });
      opts.onLog?.(out);
      logger.info(out);
    });

    ws.on("close", () => {
      roomManager.removeSession(sessionId);
    });
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(listenPort, () => resolve());
  });

  const address = httpServer.address();
  const port = typeof address === "object" && address ? address.port : (listenPort as number);

  return {
    port,
    wss,
    close: async () => {
      wss.clients.forEach((client) => {
        try { client.close(); } catch {}
      });
      roomManager.stopAll();
      await new Promise<void>((resolve) => wss.close(() => resolve()));
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    },
  };
}
