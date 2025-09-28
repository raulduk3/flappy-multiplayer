import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("ack.error.schema", () => {
  const ajv = new Ajv({ strict: false });
  const schemaPath = resolve(process.cwd(), "shared/schemas/protocol/v1/ack.error.schema.json");
  const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(schema);

  it("accepts error + reason + message_id", () => {
    const ok = { status: "error", reason: "fail", message_id: "m1" };
    expect(validate(ok)).toBe(true);
  });

  it("rejects missing fields", () => {
    expect(validate({ status: "error" } as any)).toBe(false);
  });
});
