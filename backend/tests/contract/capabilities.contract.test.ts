import path from "path";
import fs from "fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";

// T007: FR-023 capabilities request/response contract tests.
// Expects schemas to exist at T018; until then this test should fail clearly.

describe("Capabilities Contract (T007)", () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);

  const reqPath = path.join(
    __dirname,
    "../../../shared/schemas/protocol/v1/capabilities-request.schema.json",
  );
  const resPath = path.join(
    __dirname,
    "../../../shared/schemas/protocol/v1/capabilities-response.schema.json",
  );

  let reqSchema: any;
  let resSchema: any;

  beforeAll(() => {
    if (!fs.existsSync(reqPath) || !fs.existsSync(resPath)) {
      throw new Error("Missing capabilities schemas (implement in T018)");
    }
    reqSchema = JSON.parse(fs.readFileSync(reqPath, "utf-8"));
    resSchema = JSON.parse(fs.readFileSync(resPath, "utf-8"));
  });

  test("request schema minimal fields", () => {
    const validate = ajv.compile(reqSchema);
    const good = { type: "capabilities_request", protocol_version: "1.0.0" };
    expect(validate(good)).toBe(true);

    const missingVersion = { type: "capabilities_request" } as any;
    expect(validate(missingVersion)).toBe(false);
  });

  test("response schema required fields and array shape", () => {
    const validate = ajv.compile(resSchema);
    const good = {
      type: "capabilities_response",
      protocol_version: "1.0.0",
      supported_features: ["snapshot"],
    };
    expect(validate(good)).toBe(true);

    const emptyFeatures = {
      type: "capabilities_response",
      protocol_version: "1.0.0",
      supported_features: [],
    };
    // We will require non-empty features list; test expects failure if implemented that way.
    validate(emptyFeatures);
    // Implementation may decide to disallow empty array; assert either false or (if allowed) adjust in schema later.
    // For strictness now, force expectation of false to encourage non-empty design.
    expect(validate.errors ? true : false).toBe(true); // ensures we examine errors for debugging
  });
});
