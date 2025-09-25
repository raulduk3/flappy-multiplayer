import Ajv from "ajv";
import addFormats from "ajv-formats";
import * as fs from "fs";
import * as path from "path";

describe("Contract: outbound Engrave serialization", () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaPath = path.resolve(
    process.cwd(),
    "../shared/schemas/protocol/v1/envelope.schema.json",
  );
  const envelopeSchema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(envelopeSchema as any);

  it("accepts valid engrave name length 1-24", () => {
    const ok1 = validate({
      type: "engrave",
      protocol_version: "1.0.0",
      run_id: "r-123",
      name: "A",
    });
    const ok24 = validate({
      type: "engrave",
      protocol_version: "1.0.0",
      run_id: "r-123",
      name: "X".repeat(24),
    });
    expect(ok1).toBe(true);
    expect(ok24).toBe(true);
  });

  it("rejects empty or too long names", () => {
    const empty = validate({
      type: "engrave",
      protocol_version: "1.0.0",
      run_id: "r-123",
      name: "",
    } as any);
    const tooLong = validate({
      type: "engrave",
      protocol_version: "1.0.0",
      run_id: "r-123",
      name: "X".repeat(25),
    } as any);
    expect(empty).toBe(false);
    expect(tooLong).toBe(false);
  });
});
