import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Ajv = require("ajv");

describe("runStart.event.schema", () => {
  const ajv = new Ajv({ strict: false });
  const schemaPath = resolve(
    process.cwd(),
    "shared/schemas/protocol/v1/runStart.event.schema.json",
  );
  const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(schema);

  it("accepts valid runStart.event", () => {
    const msg = {
      protocol_version: "1",
      type: "runStart.event",
      payload: { room_id: "r1", run_id: "run1", tick: 0 },
    };
    expect(validate(msg)).toBe(true);
  });
  it("rejects missing run_id", () => {
    const bad = {
      protocol_version: "1",
      type: "runStart.event",
      payload: { room_id: "r1", tick: 0 },
    } as any;
    expect(validate(bad)).toBe(false);
  });
});
