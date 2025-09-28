import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";
describe("integration: unsupported protocol_version → error ack", () => {
    it("responds with ack.error for protocol_version 0.9", async () => {
        const srv = await startServer({ port: 0 });
        const url = `ws://localhost:${srv.port}`;
        try {
            const ack = await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error("timeout waiting for ack")), 3000);
                const ws = new WebSocket(url);
                ws.on("open", () => {
                    const envelope = {
                        protocol_version: "0.9",
                        type: "test.ping",
                        payload: { nonce: "abc" },
                    };
                    ws.send(JSON.stringify(envelope));
                });
                ws.on("message", (data) => {
                    clearTimeout(timer);
                    ws.close();
                    resolve(JSON.parse(data.toString()));
                });
                ws.on("error", (err) => {
                    clearTimeout(timer);
                    reject(err);
                });
            });
            expect(ack).toBeDefined();
            expect(ack.status).toBe("error");
            expect(typeof ack.reason).toBe("string");
            expect(typeof ack.message_id).toBe("string");
        }
        finally {
            await srv.close();
        }
    });
});
