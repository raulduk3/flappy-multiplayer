import path from "path";
import fs from "fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";

describe("Flap Input Contract (T019)", () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaPath = path.join(
    __dirname,
    "../../../shared/schemas/protocol/v1/flap-input.schema.json",
  );
  let schema: any;
  beforeAll(() => {
    if (!fs.existsSync(schemaPath))
      throw new Error("Missing flap-input schema (T019)");
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  });
  test("valid flap minimal", () => {
    const v = ajv.compile(schema);
    expect(v({ type: "flap" })).toBe(true);
  });
  test("client_time must be >=0", () => {
    const v = ajv.compile(schema);
    expect(v({ type: "flap", client_time: -1 } as any)).toBe(false);
  });
});
