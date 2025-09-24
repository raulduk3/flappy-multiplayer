import path from "path";
import fs from "fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";

describe("Join Ack Contract (T018)", () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  const schemaPath = path.join(
    __dirname,
    "../../../shared/schemas/protocol/v1/join-ack.schema.json",
  );
  let schema: any;
  beforeAll(() => {
    if (!fs.existsSync(schemaPath))
      throw new Error("Missing join-ack schema (T018)");
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  });
  test("valid ack", () => {
    const v = ajv.compile(schema);
    expect(
      v({
        type: "joinAck",
        protocol_version: "1.0.0",
        room_id: "r",
        max_humans: 20,
        bots_per_human: 3,
        tick_hz: 60,
      }),
    ).toBe(true);
  });
  test("missing required fails", () => {
    const v = ajv.compile(schema);
    expect(v({ type: "joinAck", protocol_version: "1.0.0" } as any)).toBe(
      false,
    );
  });
});
