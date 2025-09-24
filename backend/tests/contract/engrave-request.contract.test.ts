import path from "path";
import fs from "fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";

describe("Engrave Request Contract (T015)", () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaPath = path.join(
    __dirname,
    "../../../shared/schemas/protocol/v1/engrave-request.schema.json",
  );
  let schema: any;
  beforeAll(() => {
    if (!fs.existsSync(schemaPath))
      throw new Error("Missing engrave-request schema (T015)");
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  });
  test("valid request", () => {
    const v = ajv.compile(schema);
    expect(
      v({
        type: "engrave",
        protocol_version: "1.0.0",
        run_id: "r",
        name: "Name",
      }),
    ).toBe(true);
  });
  test("too long name fails", () => {
    const v = ajv.compile(schema);
    expect(
      v({
        type: "engrave",
        protocol_version: "1.0.0",
        run_id: "r",
        name: "x".repeat(30),
      } as any),
    ).toBe(false);
  });
});
