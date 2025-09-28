import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
describe("test.ping.ack.success.schema", () => {
    const ajv = new Ajv({ strict: false });
    const schemaPath = resolve(process.cwd(), "shared/schemas/protocol/v1/test.ping.ack.success.schema.json");
    const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
    const validate = ajv.compile(schema);
    it("accepts ok + nonce + message_id", () => {
        const ok = { status: "ok", nonce: "abc", message_id: "m1" };
        expect(validate(ok)).toBe(true);
    });
    it("rejects missing fields", () => {
        expect(validate({ status: "ok" })).toBe(false);
    });
});
