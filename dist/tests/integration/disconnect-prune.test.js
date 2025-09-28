import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";
// T046: Disconnect mid-run finalizes run and prunes player from snapshots
describe("integration: disconnect mid-run prunes from snapshots", () => {
    it("closing one client mid-run removes it from other clients' snapshots", async () => {
        const srv = await startServer({ port: 0 });
        const url = `ws://localhost:${srv.port}`;
        try {
            const ws1 = new WebSocket(url);
            const ws2 = new WebSocket(url);
            let runId1 = null;
            let runId2 = null;
            let bothVisibleOnce = false;
            let snapshotsAfterClose = 0;
            await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error("timeout waiting for prune after disconnect")), 7000);
                function maybeStart(ws) {
                    // Send join + start sequence
                    ws.send(JSON.stringify({
                        protocol_version: "1",
                        type: "join.request",
                        payload: {},
                    }));
                    setTimeout(() => {
                        ws.send(JSON.stringify({
                            protocol_version: "1",
                            type: "input.flap.request",
                            payload: {},
                        }));
                    }, 50);
                }
                ws1.on("open", () => maybeStart(ws1));
                ws2.on("open", () => maybeStart(ws2));
                ws1.on("message", (data) => {
                    const msg = JSON.parse(data.toString());
                    if (msg?.type === "runStart.event") {
                        runId1 = msg.payload.run_id;
                    }
                });
                ws2.on("message", (data) => {
                    const msg = JSON.parse(data.toString());
                    if (msg?.type === "runStart.event") {
                        runId2 = msg.payload.run_id;
                    }
                    if (msg?.type === "snapshot.event") {
                        const players = msg.payload.players;
                        if (!bothVisibleOnce && runId1 && runId2) {
                            const has1 = players.some((p) => p.run_id === runId1);
                            const has2 = players.some((p) => p.run_id === runId2);
                            if (has1 && has2) {
                                bothVisibleOnce = true;
                                // Close ws1 to simulate a disconnect mid-run
                                ws1.close();
                            }
                        }
                        else if (bothVisibleOnce) {
                            snapshotsAfterClose += 1;
                            // After a few snapshots, ws1's run should be gone
                            const has1 = players.some((p) => p.run_id === runId1);
                            if (snapshotsAfterClose >= 3) {
                                clearTimeout(timer);
                                try {
                                    expect(has1).toBe(false);
                                }
                                catch (e) {
                                    reject(e);
                                    return;
                                }
                                // Clean up ws2 then resolve
                                ws2.close();
                                resolve();
                            }
                        }
                    }
                });
                const onErr = (err) => {
                    clearTimeout(timer);
                    reject(err);
                };
                ws1.on("error", onErr);
                ws2.on("error", onErr);
            });
        }
        finally {
            await srv.close();
        }
    }, 10000);
});
