import path from "path";
import fs from "fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";

describe("RunEnd Contract (T014)", () => {
    const ajv = new Ajv({ allErrors: true, strict: true });
    addFormats(ajv);
    const schemaPath = path.join(
        __dirname,
        "../../../shared/schemas/protocol/v1/run-end.schema.json",
    );
    let schema: any;
    beforeAll(() => {
        if (!fs.existsSync(schemaPath))
            throw new Error("Missing run-end schema (T014)");
        schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
    });
    test("valid runEnd passes", () => {
        const validate = ajv.compile(schema);
        const good = {
            type: "runEnd",
            protocol_version: "1.0.0",
            room_id: "room",
            run_id: "run",
            score: 0,
            distance: 0,
            pipes_passed: 0,
            elapsed_ms: 0,
            
            cause: "collision",
        };
        expect(validate(good)).toBe(true);
    });
    test("invalid cause fails", () => {
        const validate = ajv.compile(schema);
        const bad = {
            type: "runEnd",
            protocol_version: "1.0.0",
            room_id: "room",
            run_id: "run",
            score: 0,
            distance: 0,
            pipes_passed: 0,
            elapsed_ms: 0,
            cause: "server_shutdown",
        } as any;
        expect(validate(bad)).toBe(false);
    });
});
