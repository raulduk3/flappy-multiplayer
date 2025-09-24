// T051: Protocol version SemVer presence contract test
import { readFileSync } from "fs";
import path from "path";

function loadJSON(p: string) {
  return JSON.parse(readFileSync(p, "utf8"));
}

const envelopePath = path.join(
  process.cwd(),
  "../shared/schemas/protocol/v1/envelope.schema.json",
);

describe("Protocol Version Contract (T051)", () => {
  test("envelope schema defines ProtocolVersion pattern", () => {
    const env = loadJSON(envelopePath);
    const pv = env.definitions?.ProtocolVersion;
    expect(pv).toBeTruthy();
    expect(pv.pattern).toBe("^\\d+\\.\\d+\\.\\d+$");
  });
});
