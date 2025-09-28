import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Ajv = require("ajv");

describe("join.ack.schema", () => {
  const ajv = new Ajv({ strict: false });
  const schemaPath = resolve(
    process.cwd(),
    "shared/schemas/protocol/v1/join.ack.schema.json",
  );
  const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(schema);

  it("accepts valid join.ack", () => {
    const msg = {
      protocol_version: "1",
      type: "join.ack",
      payload: { room_id: "r1", seed: "seed-123" },
    };
    expect(validate(msg)).toBe(true);
  });

  it("rejects when payload missing fields", () => {
    const bad = {
      protocol_version: "1",
      type: "join.ack",
      payload: { room: "r1" },
    } as any;
    expect(validate(bad)).toBe(false);
  });
});
