import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";
// T047: Rate limiting — 5 flaps/sec per player; excess ignored and server returns ack.error 'rate_limited'
describe("integration: rate limiting on flaps", () => {
    it("sends ack.error for flaps beyond 5 per second and ignores them", async () => {
        const srv = await startServer({ port: 0 });
        const url = `ws://localhost:${srv.port}`;
        try {
            const ws = new WebSocket(url);
            const errors = [];
            let started = false;
            await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error("timeout waiting for rate-limit acks")), 7000);
                ws.on("open", () => {
                    ws.send(JSON.stringify({
                        protocol_version: "1",
                        type: "join.request",
                        payload: {},
                    }));
                    setTimeout(() => {
                        // First flap starts the run
                        ws.send(JSON.stringify({
                            protocol_version: "1",
                            type: "input.flap.request",
                            payload: {},
                        }));
                        started = true;
                        // Now spam 10 more flaps rapidly within < 1s
                        let sent = 0;
                        const iv = setInterval(() => {
                            if (sent++ >= 10) {
                                clearInterval(iv);
                                return;
                            }
                            ws.send(JSON.stringify({
                                protocol_version: "1",
                                type: "input.flap.request",
                                payload: {},
                            }));
                        }, 30);
                    }, 50);
                });
                ws.on("message", (data) => {
                    const msg = JSON.parse(data.toString());
                    if (msg?.status === "error" && msg?.reason === "rate_limited") {
                        errors.push(msg);
                    }
                    // After a short window, validate we saw some rate limits
                    if (started && errors.length >= 3) {
                        clearTimeout(timer);
                        ws.close();
                        resolve();
                    }
                });
                ws.on("error", (err) => {
                    clearTimeout(timer);
                    reject(err);
                });
            });
            // We expect at least some rate-limited errors out of the 10 attempts within 1s
            expect(errors.length).toBeGreaterThanOrEqual(3);
        }
        finally {
            await srv.close();
        }
    }, 10000);
});
