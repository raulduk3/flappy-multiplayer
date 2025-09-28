import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("test.ping.request.schema", () => {
  const ajv = new Ajv({ strict: false });
  const schemaPath = resolve(
    process.cwd(),
    "shared/schemas/protocol/v1/test.ping.request.schema.json",
  );
  const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(schema);

  it("accepts nonce:string", () => {
    expect(validate({ nonce: "abc" })).toBe(true);
  });

  it("rejects missing nonce", () => {
    expect(validate({} as any)).toBe(false);
  });
});
