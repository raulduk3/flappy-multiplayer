import fs from "fs";
import path from "path";

describe("Termination Cause Enum Coverage (T052)", () => {
  test("run-end schema cause enum matches spec list", () => {
    const p = path.join(
      __dirname,
      "../../../shared/schemas/protocol/v1/run-end.schema.json",
    );
    const schema = JSON.parse(fs.readFileSync(p, "utf-8"));
    const enumValues = schema.properties.cause.enum as string[];
    const expected = [
      "collision",
      "boundary",
      "cheat-removal",
      "disconnect",
      "timeout",
      "server-shutdown",
    ];
    // Order-insensitive comparison
    expect(new Set(enumValues)).toEqual(new Set(expected));
    // No extras
    expect(enumValues.length).toBe(expected.length);
  });
});
