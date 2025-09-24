// T016: Message validator unit test (will fail until validator implemented in shared src)
import Ajv from "ajv";
import addFormats from "ajv-formats";
import path from "path";
import fs from "fs";

describe("Message Validator (T016)", () => {
  test("valid hello passes, malformed fails", () => {
    const schemaPath = path.join(
      __dirname,
      "../../../schemas/protocol/v1/envelope.schema.json",
    );
    if (!fs.existsSync(schemaPath)) {
      throw new Error("Missing envelope schema (implement T017).");
    }
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
    const ajv = new Ajv({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    const good = { type: "hello", protocol_version: "1.0.0" };
    expect(validate(good)).toBe(true);

    const bad = { type: "hello" } as any;
    expect(validate(bad)).toBe(false);
  });
});
