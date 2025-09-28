import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Ajv = require("ajv");

describe("snapshot.event.schema", () => {
  const ajv = new Ajv({ strict: false });
  const schemaPath = resolve(
    process.cwd(),
    "shared/schemas/protocol/v1/snapshot.event.schema.json",
  );
  const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(schema);

  it("accepts valid snapshot.event", () => {
    const msg = {
      protocol_version: "1",
      type: "snapshot.event",
      payload: {
        room_id: "r1",
        tick: 10,
        seed: "seed-1",
        players: [
          {
            player_id: "p1",
            run_id: "run1",
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            status: "alive",
            distance: 0,
            score: 0,
          },
        ],
      },
    };
    expect(validate(msg)).toBe(true);
  });

  it("rejects missing players array", () => {
    const bad = {
      protocol_version: "1",
      type: "snapshot.event",
      payload: { room_id: "r1", tick: 1, seed: "s" },
    } as any;
    expect(validate(bad)).toBe(false);
  });
});
