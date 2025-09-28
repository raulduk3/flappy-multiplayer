import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";
describe("integration: join → joinAck", () => {
    it("responds with join.ack including room_id and seed", async () => {
        const srv = await startServer({ port: 0 });
        const url = `ws://localhost:${srv.port}`;
        try {
            const ack = await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error("timeout waiting for join.ack")), 3000);
                const ws = new WebSocket(url);
                ws.on("open", () => {
                    const envelope = {
                        protocol_version: "1",
                        type: "join.request",
                        payload: { client_info: { agent: "test" } },
                    };
                    ws.send(JSON.stringify(envelope));
                });
                ws.on("message", (data) => {
                    const msg = JSON.parse(data.toString());
                    clearTimeout(timer);
                    ws.close();
                    resolve(msg);
                });
                ws.on("error", (err) => {
                    clearTimeout(timer);
                    reject(err);
                });
            });
            expect(ack).toBeDefined();
            expect(ack.protocol_version).toBe("1");
            expect(ack.type).toBe("join.ack");
            expect(typeof ack.payload?.room_id).toBe("string");
            expect(typeof ack.payload?.seed).toBe("string");
        }
        finally {
            await srv.close();
        }
    });
});
