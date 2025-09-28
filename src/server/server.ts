import { createServer as createHttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { createLogger, buildLogEntry } from "../shared/logging.js";
import type { LogEntry } from "../shared/types.js";
import { validateEnvelope, validateTestPing } from "../shared/schema.js";

const SUPPORTED_PROTOCOL_VERSION = "1.0";

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
  ws.send(JSON.stringify(obj));
}

export async function startServer(opts: StartOptions = {}): Promise<RunningServer> {
  const logger = createLogger();
  const httpServer = createHttpServer();
  const wss = new WebSocketServer({ server: httpServer });
  const listenPort = opts.port ?? 0; // 0 = ephemeral

  wss.on("connection", (ws) => {
    const sessionId = uuidv4();

    ws.on("message", (data) => {
      const raw = data.toString();
      let envelope: any;
      let messageId = uuidv4();
      try {
        envelope = JSON.parse(raw);
      } catch (err) {
        const reason = "invalid JSON";
        const type = "unknown";
        const protocol_version = "unknown";
        {
          const entry = buildLogEntry({
          session_id: sessionId,
          direction: "inbound",
          protocol_version,
          type,
          message_id: messageId,
          });
          opts.onLog?.(entry);
          logger.info(entry);
        }
        sendJson(ws, { status: "error", reason, message_id: messageId });
        {
          const entry = buildLogEntry({
          session_id: sessionId,
          direction: "outbound",
          protocol_version,
          type: "ack.error",
          message_id: messageId,
          });
          opts.onLog?.(entry);
          logger.info(entry);
        }
        return;
      }

      // Validate envelope
      const envRes = validateEnvelope(envelope);
      if (!envRes.ok) {
        const reason = "invalid envelope";
        {
          const entry = buildLogEntry({
          session_id: sessionId,
          direction: "inbound",
          protocol_version: envelope?.protocol_version ?? "unknown",
          type: envelope?.type ?? "unknown",
          message_id: messageId,
          });
          opts.onLog?.(entry);
          logger.info(entry);
        }
        sendJson(ws, { status: "error", reason, message_id: messageId });
        {
          const entry = buildLogEntry({
          session_id: sessionId,
          direction: "outbound",
          protocol_version: envelope?.protocol_version ?? "unknown",
          type: "ack.error",
          message_id: messageId,
          });
          opts.onLog?.(entry);
          logger.info(entry);
        }
        return;
      }

      const { protocol_version, type, payload } = envelope as {
        protocol_version: string;
        type: string;
        payload: any;
      };

      {
        const entry = buildLogEntry({
        session_id: sessionId,
        direction: "inbound",
        protocol_version,
        type,
        message_id: messageId,
        });
        opts.onLog?.(entry);
        logger.info(entry);
      }

      // Protocol version check
      if (protocol_version !== SUPPORTED_PROTOCOL_VERSION) {
        const reason = "unsupported protocol_version";
        sendJson(ws, { status: "error", reason, message_id: messageId });
        {
          const entry = buildLogEntry({
          session_id: sessionId,
          direction: "outbound",
          protocol_version,
          type: "ack.error",
          message_id: messageId,
          });
          opts.onLog?.(entry);
          logger.info(entry);
        }
        return;
      }

      if (type === "test.ping") {
        const val = validateTestPing(payload);
        if (!val.ok) {
          const reason = "invalid payload";
          sendJson(ws, { status: "error", reason, message_id: messageId });
          logger.info(buildLogEntry({
            session_id: sessionId,
            direction: "outbound",
            protocol_version,
            type: "ack.error",
            message_id: messageId,
          }));
          return;
        }
        // Success
        const ack = { status: "ok" as const, nonce: payload.nonce as string, message_id: messageId };
        sendJson(ws, ack);
        {
          const entry = buildLogEntry({
          session_id: sessionId,
          direction: "outbound",
          protocol_version,
          type: "ack.success",
          message_id: messageId,
          });
          opts.onLog?.(entry);
          logger.info(entry);
        }
        return;
      }

      // Unknown type
      {
        const reason = "unsupported type";
        sendJson(ws, { status: "error", reason, message_id: messageId });
        const entry = buildLogEntry({
          session_id: sessionId,
          direction: "outbound",
          protocol_version,
          type: "ack.error",
          message_id: messageId,
        });
        opts.onLog?.(entry);
        logger.info(entry);
      }
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
      await new Promise<void>((resolve) => wss.close(() => resolve()));
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    },
  };
}
