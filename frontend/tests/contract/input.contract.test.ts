import Ajv from "ajv";
import addFormats from "ajv-formats";
import * as fs from "fs";
import * as path from "path";

describe("Contract: outbound Input serialization", () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaPath = path.resolve(
    process.cwd(),
    "../shared/schemas/protocol/v1/envelope.schema.json",
  );
  const envelopeSchema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(envelopeSchema as any);

  it("valid flap input envelope", () => {
    const msg = {
      type: "input",
      protocol_version: "1.0.0",
      seq: 1,
      action: "flap",
      ts: 123456,
    } as const;
    const ok = validate(msg);
    if (!ok) {
      // eslint-disable-next-line no-console
      console.error(validate.errors);
    }
    expect(ok).toBe(true);
  });

  it("rejects missing fields", () => {
    const bad: any = { type: "input", protocol_version: "1.0.0", action: "flap" };
    const ok = validate(bad);
    expect(ok).toBe(false);
  });
});
