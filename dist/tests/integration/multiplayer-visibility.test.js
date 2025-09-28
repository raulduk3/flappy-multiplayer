import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";
// T045: Two-player room visibility and pruning
// Strengthened: require a snapshot that includes both run_ids simultaneously before triggering collision.
describe("integration: two players visible; prune on one collision", () => {
    it("both players appear in snapshots simultaneously; colliding player pruned after runEnd", async () => {
        const srv = await startServer({ port: 0 });
        const url = `ws://localhost:${srv.port}`;
        try {
            const messages1 = [];
            const messages2 = [];
            const ws1 = new WebSocket(url);
            const ws2 = new WebSocket(url);
            await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error("timeout waiting for visibility")), 10000);
                let s1Joined = false;
                let s2Joined = false;
                let bothSeenSimul = false;
                let triggeredCollision = false;
                let player1RunId = null;
                let player2RunId = null;
                const tryTriggerCollision = () => {
                    if (!triggeredCollision && bothSeenSimul) {
                        triggeredCollision = true;
                        // Cause player1 collision via burst flaps
                        let count = 0;
                        const burst = setInterval(() => {
                            if (count++ > 10) {
                                clearInterval(burst);
                                return;
                            }
                            ws1.send(JSON.stringify({
                                protocol_version: "1",
                                type: "input.flap.request",
                                payload: {},
                            }));
                        }, 10);
                    }
                };
                ws1.on("open", () => {
                    ws1.send(JSON.stringify({
                        protocol_version: "1",
                        type: "join.request",
                        payload: {},
                    }));
                    setTimeout(() => ws1.send(JSON.stringify({
                        protocol_version: "1",
                        type: "input.flap.request",
                        payload: {},
                    })), 50);
                });
                ws1.on("message", (data) => {
                    const msg = JSON.parse(data.toString());
                    messages1.push(msg);
                    if (msg.type === "join.ack")
                        s1Joined = true;
                    if (msg.type === "runStart.event")
                        player1RunId = msg.payload.run_id;
                    if (msg.type === "snapshot.event") {
                        const players = msg.payload.players;
                        if (player1RunId && player2RunId) {
                            const ids = new Set(players.map((p) => p.run_id));
                            if (ids.has(player1RunId) && ids.has(player2RunId)) {
                                bothSeenSimul = true;
                                tryTriggerCollision();
                            }
                        }
                    }
                    if (msg.type === "runEnd.event") {
                        if (!bothSeenSimul) {
                            clearTimeout(timer);
                            ws1.close();
                            ws2.close();
                            reject(new Error("runEnd occurred before both players were visible simultaneously"));
                            return;
                        }
                        const runEndId = msg.payload.run_id;
                        // Wait a bit to receive post-end snapshots on both clients
                        setTimeout(() => {
                            try {
                                const laterSnaps1 = messages1
                                    .filter((m) => m.type === "snapshot.event")
                                    .slice(-3);
                                const laterSnaps2 = messages2
                                    .filter((m) => m.type === "snapshot.event")
                                    .slice(-3);
                                for (const s of [...laterSnaps1, ...laterSnaps2]) {
                                    const players = s.payload.players;
                                    if (players && players.length > 0) {
                                        expect(players.find((p) => p.run_id === runEndId)).toBeUndefined();
                                    }
                                }
                                clearTimeout(timer);
                                ws1.close();
                                ws2.close();
                                resolve();
                            }
                            catch (e) {
                                clearTimeout(timer);
                                reject(e);
                            }
                        }, 300);
                    }
                });
                ws2.on("open", () => {
                    ws2.send(JSON.stringify({
                        protocol_version: "1",
                        type: "join.request",
                        payload: {},
                    }));
                    setTimeout(() => ws2.send(JSON.stringify({
                        protocol_version: "1",
                        type: "input.flap.request",
                        payload: {},
                    })), 50);
                });
                ws2.on("message", (data) => {
                    const msg = JSON.parse(data.toString());
                    messages2.push(msg);
                    if (msg.type === "join.ack")
                        s2Joined = true;
                    if (msg.type === "runStart.event")
                        player2RunId = msg.payload.run_id;
                    if (msg.type === "snapshot.event") {
                        const players = msg.payload.players;
                        if (player1RunId && player2RunId) {
                            const ids = new Set(players.map((p) => p.run_id));
                            if (ids.has(player1RunId) && ids.has(player2RunId)) {
                                bothSeenSimul = true;
                                tryTriggerCollision();
                            }
                        }
                    }
                });
                ws1.on("error", (err) => {
                    clearTimeout(timer);
                    reject(err);
                });
                ws2.on("error", (err) => {
                    clearTimeout(timer);
                    reject(err);
                });
            });
        }
        finally {
            await srv.close();
        }
    }, 12000);
});
