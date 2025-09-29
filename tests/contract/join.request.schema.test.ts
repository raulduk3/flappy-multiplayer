import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Ajv = require("ajv");

describe("join.request.schema", () => {
  const ajv = new Ajv({ strict: false });
  const schemaPath = resolve(
    process.cwd(),
    "shared/schemas/protocol/v1/join.request.schema.json",
  );
  const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(schema);

  it("accepts a valid join.request", () => {
    const msg = {
      protocol_version: "1",
      type: "join.request",
      payload: { client_info: { agent: "test" } },
    };
    expect(validate(msg)).toBe(true);
  });

  it("rejects wrong type", () => {
    const msg = { protocol_version: "1", type: "join", payload: {} } as any;
    expect(validate(msg)).toBe(false);
  });

  it("accepts join.request with valid color #RRGGBB", () => {
    const msg = {
      protocol_version: "1",
      type: "join.request",
      payload: { client_info: { agent: "test" }, color: "#33CC99" },
    };
    expect(validate(msg)).toBe(true);
  });

  it("rejects join.request with invalid color format", () => {
    const bad1 = {
      protocol_version: "1",
      type: "join.request",
      payload: { color: "#GG0000" },
    } as any;
    const bad2 = {
      protocol_version: "1",
      type: "join.request",
      payload: { color: "#123" },
    } as any;
    expect(validate(bad1)).toBe(false);
    expect(validate(bad2)).toBe(false);
  });
});
