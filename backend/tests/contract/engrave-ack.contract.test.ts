import path from "path";
import fs from "fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";

describe("Engrave Ack Contract (T016)", () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaPath = path.join(
    __dirname,
    "../../../shared/schemas/protocol/v1/engrave-ack.schema.json",
  );
  let schema: any;
  beforeAll(() => {
    if (!fs.existsSync(schemaPath))
      throw new Error("Missing engrave-ack schema (T016)");
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  });
  test("accepted requires name", () => {
    const v = ajv.compile(schema);
    expect(
      v({
        type: "engraveAck",
        protocol_version: "1.0.0",
        run_id: "r",
        accepted: true,
        name: "OK",
      }),
    ).toBe(true);
    expect(
      v({
        type: "engraveAck",
        protocol_version: "1.0.0",
        run_id: "r",
        accepted: true,
      } as any),
    ).toBe(false);
  });
  test("rejected requires reason", () => {
    const v = ajv.compile(schema);
    expect(
      v({
        type: "engraveAck",
        protocol_version: "1.0.0",
        run_id: "r",
        accepted: false,
        reason: "timeout",
      }),
    ).toBe(true);
    expect(
      v({
        type: "engraveAck",
        protocol_version: "1.0.0",
        run_id: "r",
        accepted: false,
      } as any),
    ).toBe(false);
  });
});
