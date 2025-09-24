import path from "path";
import fs from "fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";

describe("SnapshotV2 Contract (T013)", () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaPath = path.join(
    __dirname,
    "../../../shared/schemas/protocol/v1/snapshot-v2.schema.json",
  );
  let schema: any;
  beforeAll(() => {
    if (!fs.existsSync(schemaPath))
      throw new Error("Missing snapshot-v2 schema (T013)");
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  });
  test("valid minimal snapshot passes", () => {
    const validate = ajv.compile(schema);
    const good = {
      type: "snapshot",
      protocol_version: "1.0.0",
      room_id: "r",
      seq: "1",
      active: [],
      top: [],
      pipes: [],
    };
    expect(validate(good)).toBe(true);
  });
  test("missing required fields fails", () => {
    const validate = ajv.compile(schema);
    const bad = { type: "snapshot", protocol_version: "1.0.0" } as any;
    expect(validate(bad)).toBe(false);
  });
});
