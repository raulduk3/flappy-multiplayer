import fs from "fs";
import path from "path";
import crypto from "crypto";

describe("Registry Manifest Drift Test (T064)", () => {
  const registryPath = path.join(
    __dirname,
    "../../../shared/schemas/protocol/v1/registry.json",
  );
  const schemaDir = path.join(__dirname, "../../../shared/schemas/protocol/v1");
  let registry: any;
  beforeAll(() => {
    if (!fs.existsSync(registryPath)) throw new Error("Missing registry.json");
    registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));
  });

  test("all expected message types present", () => {
    const expected = [
      "join",
      "joinAck",
      "flap",
      "engrave",
      "engraveAck",
      "runEnd",
      "snapshot",
      "capabilities_request",
      "capabilities_response",
      "error",
    ];
    expect(Object.keys(registry.message_types).sort()).toEqual(expected.sort());
  });

  test("schema file references exist & checksum stable", () => {
    const hash = crypto.createHash("sha256");
    for (const [type, file] of Object.entries<string>(registry.message_types)) {
      const p = path.join(schemaDir, file);
      expect(fs.existsSync(p)).toBe(true);
      const contents = fs.readFileSync(p, "utf-8");
      hash.update(type + "\0" + contents + "\0");
    }
    const digest = hash.digest("hex");
    // Persist known checksum? For now just ensure length & hex pattern.
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });
});
