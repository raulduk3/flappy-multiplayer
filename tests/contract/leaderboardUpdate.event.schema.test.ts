import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Ajv = require("ajv");

describe("leaderboardUpdate.event.schema", () => {
  const ajv = new Ajv({ strict: false });
  const schemaPath = resolve(
    process.cwd(),
    "shared/schemas/protocol/v1/leaderboardUpdate.event.schema.json",
  );
  const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(schema);

  it("accepts valid leaderboardUpdate.event with entries", () => {
    const msg = {
      protocol_version: "1",
      type: "leaderboardUpdate.event",
      payload: {
        room_id: "r1",
        entries: [
          {
            player_id: "p1",
            color: "#445566",
            score: 42.5,
            ended_at: 1730000000000,
          },
        ],
      },
    };
    expect(validate(msg)).toBe(true);
  });

  it("accepts leaderboardUpdate.event with empty entries", () => {
    const msg = {
      protocol_version: "1",
      type: "leaderboardUpdate.event",
      payload: { room_id: "r1", entries: [] },
    };
    expect(validate(msg)).toBe(true);
  });

  it("rejects when color pattern invalid", () => {
    const bad = {
      protocol_version: "1",
      type: "leaderboardUpdate.event",
      payload: {
        room_id: "r1",
        entries: [
          { player_id: "p1", color: "#zzzzzz", score: 3, ended_at: 1 },
        ],
      },
    } as any;
    expect(validate(bad)).toBe(false);
  });

  it("rejects missing required fields", () => {
    const bad = {
      protocol_version: "1",
      type: "leaderboardUpdate.event",
      payload: { entries: [] },
    } as any;
    expect(validate(bad)).toBe(false);
  });
});
