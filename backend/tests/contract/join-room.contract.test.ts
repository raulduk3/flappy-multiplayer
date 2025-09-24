import path from "path";
import fs from "fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";

describe("Join Request Contract (T017)", () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaPath = path.join(
    __dirname,
    "../../../shared/schemas/protocol/v1/join-room.schema.json",
  );
  let schema: any;
  beforeAll(() => {
    if (!fs.existsSync(schemaPath))
      throw new Error("Missing join-room schema (T017)");
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  });
  test("minimal valid join", () => {
    const v = ajv.compile(schema);
    expect(v({ type: "join" })).toBe(true);
  });
  test("extra property rejected", () => {
    const v = ajv.compile(schema);
    expect(v({ type: "join", extra: true } as any)).toBe(false);
  });
});
