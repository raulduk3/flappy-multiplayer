import { describe, it, expect } from "vitest";
import WebSocket from "ws";
import { startServer } from "../../src/server/server.js";
// T049: Replay logging fields present for join, runStart, input, snapshot, runEnd
describe("integration: replay logging fields present", () => {
    it("emits log entries with replay fields across the flow", async () => {
        const entries = [];
        const srv = await startServer({ port: 0, onLog: (e) => entries.push(e) });
        const url = `ws://localhost:${srv.port}`;
        try {
            let runId = null;
            let roomId = null;
            let seed = null;
            let sawSnapshot = false;
            await new Promise((resolve, reject) => {
                const ws = new WebSocket(url);
                const timer = setTimeout(() => reject(new Error("timeout in replay-logging test")), 6000);
                ws.on("open", () => {
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
                });
                ws.on("message", (data) => {
                    const msg = JSON.parse(data.toString());
                    if (msg.type === "join.ack") {
                        roomId = msg.payload.room_id;
                        seed = msg.payload.seed;
                    }
                    else if (msg.type === "runStart.event") {
                        runId = msg.payload.run_id;
                    }
                    else if (msg.type === "snapshot.event") {
                        sawSnapshot = true;
                    }
                    else if (msg.type === "runEnd.event") {
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
            // Basic sanity
            expect(roomId).toBeTruthy();
            expect(seed).toBeTruthy();
            expect(runId).toBeTruthy();
            expect(sawSnapshot).toBe(true);
            // Verify entries contain required fields for replay
            // We expect at least one of each outbound type
            const types = entries.map((e) => e.type);
            expect(types).toContain("join.ack");
            expect(types).toContain("runStart.event");
            expect(types).toContain("snapshot.event");
            // Check that entries were enriched with replay fields when applicable
            // We don't assert exact values here, just presence of keys where relevant
            const snapshotEntries = entries.filter((e) => e.type === "snapshot.event");
            expect(snapshotEntries.length).toBeGreaterThan(0);
            for (const e of snapshotEntries) {
                expect(e.room_id).toBeDefined();
                expect(e.seed).toBeDefined();
                expect(typeof e.tick).toBe("number");
            }
            const runStartEntries = entries.filter((e) => e.type === "runStart.event");
            expect(runStartEntries.length).toBeGreaterThan(0);
            for (const e of runStartEntries) {
                expect(e.room_id).toBeDefined();
                expect(e.run_id).toBeDefined();
            }
            const runEndEntries = entries.filter((e) => e.type === "runEnd.event");
            expect(runEndEntries.length).toBeGreaterThan(0);
            for (const e of runEndEntries) {
                expect(e.room_id).toBeDefined();
                expect(e.run_id).toBeDefined();
                expect(typeof e.final_distance).toBe("number");
                expect(typeof e.final_score).toBe("number");
            }
            const inputAckErrorEntries = entries.filter((e) => e.type === "ack.error");
            // Might not occur in this flow, so just ensure schema fields exist when present
            for (const e of inputAckErrorEntries) {
                expect(e.message_id).toBeDefined();
            }
        }
        finally {
            await srv.close();
        }
    }, 10000);
});
