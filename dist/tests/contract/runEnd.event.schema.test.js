import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Ajv = require("ajv");
describe("runEnd.event.schema", () => {
    const ajv = new Ajv({ strict: false });
    const schemaPath = resolve(process.cwd(), "shared/schemas/protocol/v1/runEnd.event.schema.json");
    const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
    const validate = ajv.compile(schema);
    it("accepts valid runEnd.event", () => {
        const msg = {
            protocol_version: "1",
            type: "runEnd.event",
            payload: {
                room_id: "r1",
                run_id: "run1",
                final_distance: 10,
                final_score: 1,
                reason: "collision",
            },
        };
        expect(validate(msg)).toBe(true);
    });
    it("rejects if final_score missing", () => {
        const bad = {
            protocol_version: "1",
            type: "runEnd.event",
            payload: {
                room_id: "r1",
                run_id: "run1",
                final_distance: 10,
                reason: "collision",
            },
        };
        expect(validate(bad)).toBe(false);
    });
});
