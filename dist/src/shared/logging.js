import pino from "pino";
export function createLogger() {
    return pino({ level: process.env.LOG_LEVEL || "info" });
}
export function createLogCollector() {
    const entries = [];
    return {
        log(entry) {
            entries.push(entry);
        },
        getEntries() {
            return entries.slice();
        },
    };
}
export function buildLogEntry(params) {
    const base = {
        timestamp: new Date().toISOString(),
        session_id: params.session_id,
        direction: params.direction,
        protocol_version: params.protocol_version,
        type: params.type,
        message_id: params.message_id,
    };
    const extra = {};
    if (params.room_id !== undefined)
        extra.room_id = params.room_id;
    if (params.run_id !== undefined)
        extra.run_id = params.run_id;
    if (params.seed !== undefined)
        extra.seed = params.seed;
    if (params.tick !== undefined)
        extra.tick = params.tick;
    if (params.final_distance !== undefined)
        extra.final_distance = params.final_distance;
    if (params.final_score !== undefined)
        extra.final_score = params.final_score;
    return { ...base, ...extra };
}
