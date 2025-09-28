import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Ajv = require("ajv");
describe("input.flap.request.schema", () => {
    const ajv = new Ajv({ strict: false });
    const schemaPath = resolve(process.cwd(), "shared/schemas/protocol/v1/input.flap.request.schema.json");
    const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
    const validate = ajv.compile(schema);
    it("accepts valid input.flap.request", () => {
        const msg = {
            protocol_version: "1",
            type: "input.flap.request",
            payload: { run_id: "run1" },
        };
        expect(validate(msg)).toBe(true);
    });
    it("rejects wrong type", () => {
        const bad = {
            protocol_version: "1",
            type: "input.request",
            payload: { run_id: "run1" },
        };
        expect(validate(bad)).toBe(false);
    });
});
