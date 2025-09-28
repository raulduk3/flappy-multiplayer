import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";
describe("integration: connect → ping → ack", () => {
    it("responds with ack.success including matching nonce and message_id within 3s", async () => {
        const logs = [];
        const srv = await startServer({ port: 0, onLog: (e) => logs.push(e) });
        const url = `ws://localhost:${srv.port}`;
        try {
            const ack = await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error("timeout waiting for ack")), 3000);
                const ws = new WebSocket(url);
                ws.on("open", () => {
                    const envelope = {
                        protocol_version: "1",
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
            expect(ack.status).toBe("ok");
            expect(ack.nonce).toBe("abc");
            expect(typeof ack.message_id).toBe("string");
            // Optional: verify logs include inbound + outbound with message_id
            const inbound = logs.find((e) => e.direction === "inbound" && e.type === "test.ping");
            const outbound = logs.find((e) => e.direction === "outbound" && e.type === "ack.success");
            expect(inbound).toBeTruthy();
            expect(outbound).toBeTruthy();
            expect(outbound.message_id).toBe(ack.message_id);
        }
        finally {
            await srv.close();
        }
    });
});
