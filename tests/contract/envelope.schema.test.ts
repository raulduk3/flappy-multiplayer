import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("envelope.schema", () => {
  const ajv = new Ajv({ strict: false });
  const schemaPath = resolve(process.cwd(), "shared/schemas/protocol/v1/envelope.schema.json");
  const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(schema);

  it("accepts a valid envelope", () => {
    const good = {
      protocol_version: "1.0",
      type: "test.ping",
      payload: { nonce: "abc" }
    };
    expect(validate(good)).toBe(true);
  });

  it("rejects missing fields", () => {
    const bad = { type: "test.ping", payload: {} } as any;
    expect(validate(bad)).toBe(false);
  });
});
